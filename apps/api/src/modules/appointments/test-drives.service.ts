import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateTestDriveBookingInput,
  TestDriveAvailabilityResponse,
  TestDriveBookingConfirmation,
  TestDriveSlot,
} from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';
import {
  createUtcFromIst,
  formatIstTimeRange,
  generateBookingReference,
  generateConfirmationToken,
} from './slot-utils.js';

const TEST_DRIVE_START_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18];
const TEST_DRIVE_DURATION_MINUTES = 45;

export class TestDrivesService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async getAvailability(params: {
    showroomId: string;
    variantId: string;
    date: string;
  }): Promise<TestDriveAvailabilityResponse> {
    const { showroomId, variantId, date } = params;

    const showroom = await this.prisma.showroom.findFirst({
      where: {
        OR: [{ id: showroomId }, { code: showroomId }],
        isActive: true,
      },
    });

    if (!showroom) {
      throw new AppError(404, 'SHOWROOM_NOT_FOUND', `Showroom '${showroomId}' not found.`);
    }

    const variant = await this.prisma.vehicleVariant.findFirst({
      where: {
        OR: [{ id: variantId }, { slug: variantId }],
        isActive: true,
      },
      include: { model: true },
    });

    if (!variant) {
      throw new AppError(404, 'VARIANT_NOT_FOUND', `Variant '${variantId}' not found.`);
    }

    // Find all active demo vehicles for this variant at this showroom
    const demoVehicles = await this.prisma.demoVehicle.findMany({
      where: {
        showroomId: showroom.id,
        variantId: variant.id,
        isActive: true,
      },
      select: { id: true, registrationNumber: true },
    });

    const totalDemoVehicles = demoVehicles.length;

    if (totalDemoVehicles === 0) {
      return {
        showroomId: showroom.id,
        showroomCode: showroom.code,
        showroomName: showroom.name,
        variantId: variant.id,
        variantName: variant.name,
        modelName: variant.model.name,
        date,
        hasDemoVehicle: false,
        slots: [],
      };
    }

    const demoVehicleIds = demoVehicles.map((v) => v.id);

    // Compute slots for the given date
    const slots: TestDriveSlot[] = [];

    for (const hour of TEST_DRIVE_START_HOURS) {
      const slotStart = createUtcFromIst(date, hour, 0);
      const slotEnd = new Date(slotStart.getTime() + TEST_DRIVE_DURATION_MINUTES * 60 * 1000);

      // Count confirmed appointments overlapping this slot
      const overlappingAppointments = await this.prisma.testDriveAppointment.count({
        where: {
          demoVehicleId: { in: demoVehicleIds },
          status: 'CONFIRMED',
          startTime: { lt: slotEnd },
          endTime: { gt: slotStart },
        },
      });

      const availableCount = Math.max(0, totalDemoVehicles - overlappingAppointments);

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        displayTime: formatIstTimeRange(slotStart, slotEnd),
        isAvailable: availableCount > 0,
        availableVehiclesCount: availableCount,
      });
    }

    return {
      showroomId: showroom.id,
      showroomCode: showroom.code,
      showroomName: showroom.name,
      variantId: variant.id,
      variantName: variant.name,
      modelName: variant.model.name,
      date,
      hasDemoVehicle: true,
      slots,
    };
  }

  async createBooking(
    input: CreateTestDriveBookingInput,
    ipHash?: string | null,
  ): Promise<TestDriveBookingConfirmation> {
    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Idempotency check: if request was already processed, return existing confirmation
        const existing = await tx.testDriveAppointment.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: {
            showroom: true,
            variant: { include: { model: true } },
            demoVehicle: true,
            customer: true,
          },
        });

        if (existing) {
          return this.formatConfirmation(existing);
        }

        // 2. Validate showroom & variant
        const showroom = await tx.showroom.findFirst({
          where: {
            OR: [{ id: input.showroomId }, { code: input.showroomId }],
            isActive: true,
          },
        });

        if (!showroom) {
          throw new AppError(
            404,
            'SHOWROOM_NOT_FOUND',
            `Showroom '${input.showroomId}' not found.`,
          );
        }

        const variant = await tx.vehicleVariant.findFirst({
          where: {
            OR: [{ id: input.variantId }, { slug: input.variantId }],
            isActive: true,
          },
          include: { model: true },
        });

        if (!variant) {
          throw new AppError(404, 'VARIANT_NOT_FOUND', `Variant '${input.variantId}' not found.`);
        }

        // 3. Find demo vehicles
        const demoVehicles = await tx.demoVehicle.findMany({
          where: {
            showroomId: showroom.id,
            variantId: variant.id,
            isActive: true,
          },
          select: { id: true, registrationNumber: true },
        });

        if (demoVehicles.length === 0) {
          throw new AppError(
            404,
            'NO_DEMO_FLEET',
            `No demo vehicles for ${variant.name} are available at ${showroom.name}.`,
          );
        }

        const vehicleIds = demoVehicles.map((v) => v.id);

        // 4. Lock demo vehicles for update to serialize concurrent bookings
        await tx.$queryRaw`
          SELECT id FROM demo_vehicles
          WHERE id = ANY(${vehicleIds})
          FOR UPDATE
        `;

        const startTime = new Date(input.startTime);
        if (Number.isNaN(startTime.getTime())) {
          throw new AppError(400, 'INVALID_START_TIME', 'Invalid start time provided.');
        }
        const endTime = new Date(startTime.getTime() + TEST_DRIVE_DURATION_MINUTES * 60 * 1000);

        // 5. Find booked vehicles overlapping requested slot
        const bookedAppointments = await tx.testDriveAppointment.findMany({
          where: {
            demoVehicleId: { in: vehicleIds },
            status: 'CONFIRMED',
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { demoVehicleId: true },
        });

        const bookedIds = new Set(bookedAppointments.map((a) => a.demoVehicleId));
        const freeVehicle = demoVehicles.find((v) => !bookedIds.has(v.id));

        if (!freeVehicle) {
          throw new AppError(
            409,
            'SLOT_UNAVAILABLE',
            'All demo vehicles for this model at the chosen showroom are booked for this slot.',
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
          // Update customer name if provided
          customer = await tx.customer.update({
            where: { id: customer.id },
            data: { fullName: input.customerName.trim() },
          });
        }

        // 7. Record DPDP consent
        await tx.customerConsent.create({
          data: {
            customerId: customer.id,
            purpose: 'TEST_DRIVE_BOOKING',
            noticeVersion: '2026.1',
            granted: true,
            source: 'WEBSITE',
            ipHash: ipHash ?? null,
          },
        });

        // 8. Create appointment
        const bookingReference = generateBookingReference('TD');
        const confirmationToken = generateConfirmationToken();

        const appointment = await tx.testDriveAppointment.create({
          data: {
            bookingReference,
            confirmationToken,
            idempotencyKey: input.idempotencyKey,
            showroomId: showroom.id,
            variantId: variant.id,
            demoVehicleId: freeVehicle.id,
            customerId: customer.id,
            startTime,
            endTime,
            status: 'CONFIRMED',
            driverLicenseNumber: input.driverLicenseNumber ?? null,
            notes: input.notes ?? null,
          },
          include: {
            showroom: true,
            variant: { include: { model: true } },
            demoVehicle: true,
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
    appointment: Prisma.TestDriveAppointmentGetPayload<{
      include: {
        showroom: true;
        variant: { include: { model: true } };
        demoVehicle: true;
        customer: true;
      };
    }>,
  ): TestDriveBookingConfirmation {
    return {
      bookingReference: appointment.bookingReference,
      confirmationToken: appointment.confirmationToken,
      status: appointment.status,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      showroom: {
        id: appointment.showroom.id,
        code: appointment.showroom.code,
        name: appointment.showroom.name,
        city: appointment.showroom.city,
        state: appointment.showroom.state,
      },
      vehicle: {
        modelName: appointment.variant.model.name,
        variantName: appointment.variant.name,
        demoRegistration: appointment.demoVehicle.registrationNumber,
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
