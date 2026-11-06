import type { PrismaClient } from '@prisma/client';
import type { DashboardMetricOverview, StaffUserSummary } from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';

export class DashboardService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async getDashboardOverview(staffUser: StaffUserSummary): Promise<DashboardMetricOverview> {
    const role = staffUser.role;

    // Extract assigned location IDs
    const showroomIds = staffUser.locations
      .map((loc) => loc.showroomId)
      .filter((id): id is string => Boolean(id));

    const workshopIds = staffUser.locations
      .map((loc) => loc.workshopId)
      .filter((id): id is string => Boolean(id));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Role-specific aggregations
    if (role === 'ADMIN') {
      const [
        inventoryTotal,
        inventoryAvailable,
        inventoryReserved,
        inventorySold,
        certifiedUsedCount,
        testDrivesTotal,
        servicesTotal,
        todaysServicesCount,
        activeStaffCount,
        recentTestDrivesRaw,
        recentServicesRaw,
      ] = await Promise.all([
        this.prisma.newVehicleInventory.count(),
        this.prisma.newVehicleInventory.count({ where: { status: 'AVAILABLE' } }),
        this.prisma.newVehicleInventory.count({ where: { status: 'RESERVED' } }),
        this.prisma.newVehicleInventory.count({ where: { status: 'SOLD' } }),
        this.prisma.usedVehicle.count({ where: { certified: true } }),
        this.prisma.testDriveAppointment.count(),
        this.prisma.serviceAppointment.count(),
        this.prisma.serviceAppointment.count({
          where: {
            startTime: { gte: startOfToday, lte: endOfToday },
          },
        }),
        this.prisma.staffUser.count({ where: { isActive: true } }),
        this.prisma.testDriveAppointment.findMany({
          take: 5,
          orderBy: { startTime: 'desc' },
          include: {
            showroom: true,
            variant: { include: { model: true } },
            customer: true,
          },
        }),
        this.prisma.serviceAppointment.findMany({
          take: 5,
          orderBy: { startTime: 'desc' },
          include: {
            workshop: true,
            serviceType: true,
            customer: true,
          },
        }),
      ]);

      return {
        role,
        user: staffUser,
        metrics: {
          inventoryTotal,
          inventoryAvailable,
          inventoryReserved,
          inventorySold,
          certifiedUsedCount,
          testDrivesTotal,
          servicesTotal,
          todaysServicesCount,
          activeStaffCount,
        },
        recentTestDrives: recentTestDrivesRaw.map((td) => ({
          id: td.id,
          reference: td.bookingReference,
          modelName: `${td.variant.model.name} ${td.variant.name}`,
          customerName: td.customer.fullName,
          time: td.startTime.toISOString(),
          showroomName: td.showroom.name,
          status: td.status,
        })),
        recentServices: recentServicesRaw.map((s) => ({
          id: s.id,
          reference: s.bookingReference,
          serviceName: s.serviceType.name,
          vehiclePlate: s.vehicleRegistration,
          time: s.startTime.toISOString(),
          workshopName: s.workshop.name,
          status: s.status,
        })),
      };
    }

    if (role === 'SALES_CONSULTANT') {
      const showroomFilter = showroomIds.length > 0 ? { showroomId: { in: showroomIds } } : {};

      const [testDrivesTotal, inventoryAvailable, recentTestDrivesRaw] = await Promise.all([
        this.prisma.testDriveAppointment.count({ where: showroomFilter }),
        this.prisma.newVehicleInventory.count({
          where: {
            status: 'AVAILABLE',
            ...(showroomIds.length > 0 ? { showroomId: { in: showroomIds } } : {}),
          },
        }),
        this.prisma.testDriveAppointment.findMany({
          where: showroomFilter,
          take: 8,
          orderBy: { startTime: 'desc' },
          include: {
            showroom: true,
            variant: { include: { model: true } },
            customer: true,
          },
        }),
      ]);

      return {
        role,
        user: staffUser,
        metrics: {
          testDrivesTotal,
          inventoryAvailable,
        },
        recentTestDrives: recentTestDrivesRaw.map((td) => ({
          id: td.id,
          reference: td.bookingReference,
          modelName: `${td.variant.model.name} ${td.variant.name}`,
          customerName: td.customer.fullName,
          time: td.startTime.toISOString(),
          showroomName: td.showroom.name,
          status: td.status,
        })),
        recentServices: [],
      };
    }

    if (role === 'SERVICE_ADVISOR') {
      const workshopFilter = workshopIds.length > 0 ? { workshopId: { in: workshopIds } } : {};

      const [servicesTotal, todaysServicesCount, recentServicesRaw] = await Promise.all([
        this.prisma.serviceAppointment.count({ where: workshopFilter }),
        this.prisma.serviceAppointment.count({
          where: {
            ...workshopFilter,
            startTime: { gte: startOfToday, lte: endOfToday },
          },
        }),
        this.prisma.serviceAppointment.findMany({
          where: workshopFilter,
          take: 8,
          orderBy: { startTime: 'desc' },
          include: {
            workshop: true,
            serviceType: true,
            customer: true,
          },
        }),
      ]);

      return {
        role,
        user: staffUser,
        metrics: {
          servicesTotal,
          todaysServicesCount,
        },
        recentTestDrives: [],
        recentServices: recentServicesRaw.map((s) => ({
          id: s.id,
          reference: s.bookingReference,
          serviceName: s.serviceType.name,
          vehiclePlate: s.vehicleRegistration,
          time: s.startTime.toISOString(),
          workshopName: s.workshop.name,
          status: s.status,
        })),
      };
    }

    // USED_CAR_STAFF
    const [certifiedUsedCount, availableUsedCount, soldUsedCount] = await Promise.all([
      this.prisma.usedVehicle.count({ where: { certified: true } }),
      this.prisma.usedVehicle.count({ where: { certified: true, stockStatus: 'AVAILABLE' } }),
      this.prisma.usedVehicle.count({ where: { certified: true, stockStatus: 'SOLD' } }),
    ]);

    return {
      role,
      user: staffUser,
      metrics: {
        certifiedUsedCount,
        inventoryAvailable: availableUsedCount,
        inventorySold: soldUsedCount,
      },
      recentTestDrives: [],
      recentServices: [],
    };
  }

  async listScopedAppointments(staffUser: StaffUserSummary) {
    const role = staffUser.role;
    const showroomIds = staffUser.locations
      .map((loc) => loc.showroomId)
      .filter((id): id is string => Boolean(id));
    const workshopIds = staffUser.locations
      .map((loc) => loc.workshopId)
      .filter((id): id is string => Boolean(id));

    let testDrives: Array<{
      id: string;
      reference: string;
      type: 'TEST_DRIVE';
      title: string;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      locationName: string;
      startTime: string;
      endTime: string;
      status: string;
    }> = [];

    let services: Array<{
      id: string;
      reference: string;
      type: 'SERVICE';
      title: string;
      customerName: string;
      customerPhone: string;
      customerEmail: string;
      locationName: string;
      startTime: string;
      endTime: string;
      status: string;
      vehiclePlate: string;
    }> = [];

    if (role === 'ADMIN' || role === 'SALES_CONSULTANT') {
      const filter =
        role === 'SALES_CONSULTANT' && showroomIds.length > 0
          ? { showroomId: { in: showroomIds } }
          : {};

      const rawTestDrives = await this.prisma.testDriveAppointment.findMany({
        where: filter,
        orderBy: { startTime: 'desc' },
        take: 50,
        include: {
          showroom: true,
          variant: { include: { model: true } },
          customer: true,
        },
      });

      testDrives = rawTestDrives.map((td) => ({
        id: td.id,
        reference: td.bookingReference,
        type: 'TEST_DRIVE' as const,
        title: `${td.variant.model.name} ${td.variant.name}`,
        customerName: td.customer.fullName,
        customerPhone: td.customer.phone,
        customerEmail: td.customer.email,
        locationName: td.showroom.name,
        startTime: td.startTime.toISOString(),
        endTime: td.endTime.toISOString(),
        status: td.status,
      }));
    }

    if (role === 'ADMIN' || role === 'SERVICE_ADVISOR') {
      const filter =
        role === 'SERVICE_ADVISOR' && workshopIds.length > 0
          ? { workshopId: { in: workshopIds } }
          : {};

      const rawServices = await this.prisma.serviceAppointment.findMany({
        where: filter,
        orderBy: { startTime: 'desc' },
        take: 50,
        include: {
          workshop: true,
          serviceType: true,
          customer: true,
        },
      });

      services = rawServices.map((s) => ({
        id: s.id,
        reference: s.bookingReference,
        type: 'SERVICE' as const,
        title: s.serviceType.name,
        customerName: s.customer.fullName,
        customerPhone: s.customer.phone,
        customerEmail: s.customer.email,
        locationName: s.workshop.name,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        status: s.status,
        vehiclePlate: s.vehicleRegistration,
      }));
    }

    return {
      testDrives,
      services,
    };
  }
}
