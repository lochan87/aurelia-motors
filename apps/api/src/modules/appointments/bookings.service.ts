import type { PrismaClient } from '@prisma/client';
import {
  formatInrFromPaise,
  type CancelBookingInput,
  type CancelBookingResult,
  type UnifiedBookingDetails,
} from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';
import { maskEmail, maskName, maskPhone } from './slot-utils.js';

export class BookingsService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async getBookingConfirmation(reference: string, token?: string): Promise<UnifiedBookingDetails> {
    // 1. Try finding in TestDriveAppointments
    const testDrive = await this.prisma.testDriveAppointment.findUnique({
      where: { bookingReference: reference },
      include: {
        showroom: true,
        variant: { include: { model: true } },
        demoVehicle: true,
        customer: true,
      },
    });

    if (testDrive) {
      const isAuthorized = Boolean(token && token === testDrive.confirmationToken);

      return {
        bookingType: 'TEST_DRIVE',
        bookingReference: testDrive.bookingReference,
        status: testDrive.status,
        isMasked: !isAuthorized,
        startTime: testDrive.startTime.toISOString(),
        endTime: testDrive.endTime.toISOString(),
        location: {
          name: testDrive.showroom.name,
          code: testDrive.showroom.code,
          address: `${testDrive.showroom.name}, ${testDrive.showroom.city}`,
          city: testDrive.showroom.city,
          phone: '+91 522 2720001',
        },
        title: `${testDrive.variant.model.name} — ${testDrive.variant.name}`,
        subtitle: 'Test Drive Appointment',
        customer: isAuthorized
          ? {
              fullName: testDrive.customer.fullName,
              phone: testDrive.customer.phone,
              email: testDrive.customer.email,
            }
          : {
              fullName: maskName(testDrive.customer.fullName),
              phone: maskPhone(testDrive.customer.phone),
              email: maskEmail(testDrive.customer.email),
            },
        notes: isAuthorized ? testDrive.notes : null,
        createdAt: testDrive.createdAt.toISOString(),
        canCancel: testDrive.status === 'CONFIRMED',
        meta: {
          demoRegistration: isAuthorized ? testDrive.demoVehicle.registrationNumber : undefined,
        },
      };
    }

    // 2. Try finding in ServiceAppointments
    const service = await this.prisma.serviceAppointment.findUnique({
      where: { bookingReference: reference },
      include: {
        workshop: true,
        serviceType: true,
        customer: true,
      },
    });

    if (service) {
      const isAuthorized = Boolean(token && token === service.confirmationToken);

      return {
        bookingType: 'SERVICE',
        bookingReference: service.bookingReference,
        status: service.status,
        isMasked: !isAuthorized,
        startTime: service.startTime.toISOString(),
        endTime: service.endTime.toISOString(),
        location: {
          name: service.workshop.name,
          code: service.workshop.code,
          address: service.workshop.address,
          city: service.workshop.city,
          phone: service.workshop.phone,
        },
        title: service.serviceType.name,
        subtitle: `Service for ${service.vehicleModel} (${service.vehicleRegistration})`,
        customer: isAuthorized
          ? {
              fullName: service.customer.fullName,
              phone: service.customer.phone,
              email: service.customer.email,
            }
          : {
              fullName: maskName(service.customer.fullName),
              phone: maskPhone(service.customer.phone),
              email: maskEmail(service.customer.email),
            },
        notes: isAuthorized ? service.notes : null,
        createdAt: service.createdAt.toISOString(),
        canCancel: service.status === 'CONFIRMED',
        meta: {
          estimatedCostPaise: service.serviceType.estimatedPricePaise ?? undefined,
          displayPrice: service.serviceType.estimatedPricePaise
            ? formatInrFromPaise(service.serviceType.estimatedPricePaise)
            : undefined,
          vehicleRegistration: service.vehicleRegistration,
        },
      };
    }

    throw new AppError(404, 'BOOKING_NOT_FOUND', `Booking reference '${reference}' not found.`);
  }

  async cancelBooking(reference: string, input: CancelBookingInput): Promise<CancelBookingResult> {
    const { confirmationToken, reason } = input;

    // Check TestDrive
    const testDrive = await this.prisma.testDriveAppointment.findUnique({
      where: { bookingReference: reference },
    });

    if (testDrive) {
      if (testDrive.confirmationToken !== confirmationToken) {
        throw new AppError(
          403,
          'INVALID_CONFIRMATION_TOKEN',
          'The confirmation token does not match this booking.',
        );
      }

      if (testDrive.status === 'CANCELLED') {
        return {
          bookingReference: testDrive.bookingReference,
          status: 'CANCELLED',
          message: 'Booking is already cancelled.',
          cancelledAt: (testDrive.cancelledAt ?? new Date()).toISOString(),
        };
      }

      const cancelledAt = new Date();
      await this.prisma.testDriveAppointment.update({
        where: { id: testDrive.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason ?? 'Cancelled by customer',
          cancelledAt,
        },
      });

      return {
        bookingReference: testDrive.bookingReference,
        status: 'CANCELLED',
        message: 'Your test drive booking has been successfully cancelled.',
        cancelledAt: cancelledAt.toISOString(),
      };
    }

    // Check Service
    const service = await this.prisma.serviceAppointment.findUnique({
      where: { bookingReference: reference },
    });

    if (service) {
      if (service.confirmationToken !== confirmationToken) {
        throw new AppError(
          403,
          'INVALID_CONFIRMATION_TOKEN',
          'The confirmation token does not match this booking.',
        );
      }

      if (service.status === 'CANCELLED') {
        return {
          bookingReference: service.bookingReference,
          status: 'CANCELLED',
          message: 'Booking is already cancelled.',
          cancelledAt: (service.cancelledAt ?? new Date()).toISOString(),
        };
      }

      const cancelledAt = new Date();
      await this.prisma.serviceAppointment.update({
        where: { id: service.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason ?? 'Cancelled by customer',
          cancelledAt,
        },
      });

      return {
        bookingReference: service.bookingReference,
        status: 'CANCELLED',
        message: 'Your service appointment has been successfully cancelled.',
        cancelledAt: cancelledAt.toISOString(),
      };
    }

    throw new AppError(404, 'BOOKING_NOT_FOUND', `Booking reference '${reference}' not found.`);
  }
}
