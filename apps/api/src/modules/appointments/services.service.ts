import type { Prisma, PrismaClient } from '@prisma/client';
import {
  formatInrFromPaise,
  type CreateServiceBookingInput,
  type ServiceAvailabilityResponse,
  type ServiceBookingConfirmation,
  type ServiceSlot,
  type ServiceTypeSummary,
  type WorkshopSummary,
} from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';
import {
  createUtcFromIst,
  formatIstTimeRange,
  generateBookingReference,
  generateConfirmationToken,
  getKolkataDayOfWeek,
} from './slot-utils.js';

const SERVICE_START_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

export class ServicesService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async listWorkshops(): Promise<WorkshopSummary[]> {
    const workshops = await this.prisma.workshop.findMany({
      where: { isActive: true },
      include: {
        showroom: true,
        operatingHours: { orderBy: { dayOfWeek: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });

    return workshops.map((workshop) => ({
      id: workshop.id,
      showroomId: workshop.showroom?.id ?? workshop.id,
      showroomName: workshop.showroom?.name ?? workshop.name,
      name: workshop.name,
      code: workshop.code,
      slotCapacity: workshop.slotCapacity,
      phone: workshop.phone,
      address: workshop.address,
      city: workshop.city,
      state: workshop.state,
      postalCode: '226010',
      operatingHours: workshop.operatingHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        openTime: h.opensAt,
        closeTime: h.closesAt,
        isClosed: !h.isOpen,
      })),
    }));
  }

  async listServiceTypes(): Promise<ServiceTypeSummary[]> {
    const types = await this.prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return types.map((st) => ({
      id: st.id,
      code: st.code,
      name: st.name,
      description: st.description,
      durationMinutes: st.durationMinutes,
      basePricePaise: st.estimatedPricePaise ?? 0,
      displayPrice: st.estimatedPricePaise
        ? formatInrFromPaise(st.estimatedPricePaise)
        : 'Quote on inspection',
    }));
  }

  async getAvailability(params: {
    workshopId: string;
    serviceTypeId: string;
    date: string;
  }): Promise<ServiceAvailabilityResponse> {
    const { workshopId, serviceTypeId, date } = params;

    const workshop = await this.prisma.workshop.findFirst({
      where: {
        OR: [{ id: workshopId }, { code: workshopId }],
        isActive: true,
      },
    });

    if (!workshop) {
      throw new AppError(404, 'WORKSHOP_NOT_FOUND', `Workshop '${workshopId}' not found.`);
    }

    const serviceType = await this.prisma.serviceType.findFirst({
      where: {
        OR: [{ id: serviceTypeId }, { code: serviceTypeId }],
        isActive: true,
      },
    });

    if (!serviceType) {
      throw new AppError(
        404,
        'SERVICE_TYPE_NOT_FOUND',
        `Service type '${serviceTypeId}' not found.`,
      );
    }

    // Check operating hours for day of week
    const sampleDate = createUtcFromIst(date, 12, 0);
    const dayOfWeek = getKolkataDayOfWeek(sampleDate);

    const operatingHour = await this.prisma.workshopOperatingHours.findUnique({
      where: {
        workshopId_dayOfWeek: { workshopId: workshop.id, dayOfWeek },
      },
    });

    if (!operatingHour || !operatingHour.isOpen) {
      return {
        workshopId: workshop.id,
        workshopCode: workshop.code,
        workshopName: workshop.name,
        serviceTypeId: serviceType.id,
        serviceTypeName: serviceType.name,
        durationMinutes: serviceType.durationMinutes,
        date,
        isOpen: false,
        slots: [],
      };
    }

    const [closeHour, closeMinute] = operatingHour.closesAt.split(':').map(Number);
    const closingTimeUtc = createUtcFromIst(date, closeHour ?? 18, closeMinute ?? 30);

    const slots: ServiceSlot[] = [];

    for (const hour of SERVICE_START_HOURS) {
      const slotStart = createUtcFromIst(date, hour, 0);
      const slotEnd = new Date(slotStart.getTime() + serviceType.durationMinutes * 60 * 1000);

      // Only include slots that finish before or at workshop closing time
      if (slotEnd.getTime() > closingTimeUtc.getTime()) {
        continue;
      }

      // Count overlapping active service appointments
      const overlappingCount = await this.prisma.serviceAppointment.count({
        where: {
          workshopId: workshop.id,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          startTime: { lt: slotEnd },
          endTime: { gt: slotStart },
        },
      });

      const capacityRemaining = Math.max(0, workshop.slotCapacity - overlappingCount);

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        displayTime: formatIstTimeRange(slotStart, slotEnd),
        isAvailable: capacityRemaining > 0,
        capacityRemaining,
      });
    }

    return {
      workshopId: workshop.id,
      workshopCode: workshop.code,
      workshopName: workshop.name,
      serviceTypeId: serviceType.id,
      serviceTypeName: serviceType.name,
      durationMinutes: serviceType.durationMinutes,
      date,
      isOpen: true,
      slots,
    };
  }

  async createBooking(
    input: CreateServiceBookingInput,
    ipHash?: string | null,
  ): Promise<ServiceBookingConfirmation> {
    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Idempotency check: if request was already processed, return existing confirmation
        const existing = await tx.serviceAppointment.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: {
            workshop: true,
            serviceType: true,
            customer: true,
          },
        });

        if (existing) {
          return this.formatConfirmation(existing);
        }

        // 2. Validate workshop & service type
        const workshop = await tx.workshop.findFirst({
          where: {
            OR: [{ id: input.workshopId }, { code: input.workshopId }],
            isActive: true,
          },
        });

        if (!workshop) {
          throw new AppError(
            404,
            'WORKSHOP_NOT_FOUND',
            `Workshop '${input.workshopId}' not found.`,
          );
        }

        const serviceType = await tx.serviceType.findFirst({
          where: {
            OR: [{ id: input.serviceTypeId }, { code: input.serviceTypeId }],
            isActive: true,
          },
        });

        if (!serviceType) {
          throw new AppError(
            404,
            'SERVICE_TYPE_NOT_FOUND',
            `Service type '${input.serviceTypeId}' not found.`,
          );
        }

        // 3. Lock workshop row to serialize concurrent booking attempts
        await tx.$queryRaw`
          SELECT id FROM workshops
          WHERE id = ${workshop.id}
          FOR UPDATE
        `;

        const startTime = new Date(input.startTime);
        if (Number.isNaN(startTime.getTime())) {
          throw new AppError(400, 'INVALID_START_TIME', 'Invalid start time provided.');
        }

        const endTime = new Date(startTime.getTime() + serviceType.durationMinutes * 60 * 1000);

        // 4. Verify day is open
        const dayOfWeek = getKolkataDayOfWeek(startTime);
        const operatingHour = await tx.workshopOperatingHours.findUnique({
          where: {
            workshopId_dayOfWeek: { workshopId: workshop.id, dayOfWeek },
          },
        });

        if (!operatingHour || !operatingHour.isOpen) {
          throw new AppError(
            400,
            'WORKSHOP_CLOSED',
            'The workshop is closed on the selected appointment date.',
          );
        }

        // 5. Check capacity
        const overlappingAppointments = await tx.serviceAppointment.count({
          where: {
            workshopId: workshop.id,
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        });

        if (overlappingAppointments >= workshop.slotCapacity) {
          throw new AppError(
            409,
            'WORKSHOP_CAPACITY_EXCEEDED',
            'The selected workshop slot has reached maximum capacity. Please choose another time.',
          );
        }

        // 6. Find or create customer
        const email = input.customerEmail.toLowerCase().trim();
        const phone = input.customerPhone.trim();

        let customer = await tx.customer.findFirst({
          where: {
            OR: [{ email }, { phone }],
          },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              fullName: input.customerName.trim(),
              email,
              phone,
            },
          });
        } else if (customer.fullName !== input.customerName.trim()) {
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { fullName: input.customerName.trim() },
          });
        }

        // 7. Record DPDP consent
        await tx.customerConsent.create({
          data: {
            customerId: customer.id,
            purpose: 'SERVICE_BOOKING',
            noticeVersion: '2026.1',
            granted: true,
            source: 'WEBSITE',
            ipHash: ipHash ?? null,
          },
        });

        // 8. Create appointment
        const bookingReference = generateBookingReference('SRV');
        const confirmationToken = generateConfirmationToken();

        const appointment = await tx.serviceAppointment.create({
          data: {
            bookingReference,
            confirmationToken,
            idempotencyKey: input.idempotencyKey,
            workshopId: workshop.id,
            serviceTypeId: serviceType.id,
            customerId: customer.id,
            vehicleRegistration: input.registrationNumber.toUpperCase().trim(),
            vehicleModel: input.vehicleModel.trim(),
            vehicleYear: input.vehicleYear ?? null,
            vehicleMileageKm: input.currentMileageKm ?? null,
            startTime,
            endTime,
            status: 'CONFIRMED',
            notes: input.notes ?? null,
          },
          include: {
            workshop: true,
            serviceType: true,
            customer: true,
          },
        });

        return this.formatConfirmation(appointment);
      },
      {
        isolationLevel: 'ReadCommitted',
      },
    );
  }

  private formatConfirmation(
    appointment: Prisma.ServiceAppointmentGetPayload<{
      include: {
        workshop: true;
        serviceType: true;
        customer: true;
      };
    }>,
  ): ServiceBookingConfirmation {
    return {
      bookingReference: appointment.bookingReference,
      confirmationToken: appointment.confirmationToken,
      status: appointment.status,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      workshop: {
        id: appointment.workshop.id,
        name: appointment.workshop.name,
        code: appointment.workshop.code,
        address: appointment.workshop.address,
        phone: appointment.workshop.phone,
      },
      serviceType: {
        id: appointment.serviceType.id,
        name: appointment.serviceType.name,
        durationMinutes: appointment.serviceType.durationMinutes,
        estimatedCostPaise: appointment.serviceType.estimatedPricePaise ?? 0,
        displayPrice: appointment.serviceType.estimatedPricePaise
          ? formatInrFromPaise(appointment.serviceType.estimatedPricePaise)
          : 'Quote on inspection',
      },
      vehicle: {
        registrationNumber: appointment.vehicleRegistration,
        modelName: appointment.vehicleModel,
        year: appointment.vehicleYear,
        mileageKm: appointment.vehicleMileageKm,
      },
      customer: {
        fullName: appointment.customer.fullName,
        phone: appointment.customer.phone,
        email: appointment.customer.email,
      },
      notes: appointment.notes,
      createdAt: appointment.createdAt.toISOString(),
    };
  }
}
