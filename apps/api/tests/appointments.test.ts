import crypto from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

describe('Appointments & Bookings API', () => {
  let showroomId: string;
  let variantId: string;
  let workshopId: string;
  let serviceTypeId: string;

  beforeAll(async () => {
    // Clean up test appointments
    await prisma.testDriveAppointment.deleteMany();
    await prisma.serviceAppointment.deleteMany();

    // Look up existing seeded records
    const showroom = await prisma.showroom.findUniqueOrThrow({
      where: { code: 'LKO-CENTRAL' },
    });
    showroomId = showroom.id;

    // Find a variant that has demo vehicles at Central Lucknow
    const demoVehicle = await prisma.demoVehicle.findFirstOrThrow({
      where: { showroomId: showroom.id, isActive: true },
      include: { variant: true },
    });
    variantId = demoVehicle.variantId;

    // Look up a workshop
    const workshop = await prisma.workshop.findUniqueOrThrow({
      where: { code: 'WS-GOMTI' },
    });
    workshopId = workshop.id;

    // Look up a service type
    const serviceType = await prisma.serviceType.findUniqueOrThrow({
      where: { code: 'EXPRESS_CARE' },
    });
    serviceTypeId = serviceType.id;
  });

  // -------------------------------------------------------------------------
  // Test-Drive Availability
  // -------------------------------------------------------------------------
  describe('GET /api/test-drives/availability', () => {
    it('returns available slots for a valid showroom and variant', async () => {
      const response = await request(app).get('/api/test-drives/availability').query({
        showroomId,
        variantId,
        date: '2026-11-20',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hasDemoVehicle).toBe(true);
      expect(Array.isArray(response.body.data.slots)).toBe(true);
      expect(response.body.data.slots.length).toBeGreaterThan(0);

      const firstSlot = response.body.data.slots[0];
      expect(firstSlot).toHaveProperty('startTime');
      expect(firstSlot).toHaveProperty('endTime');
      expect(firstSlot).toHaveProperty('isAvailable');
      expect(firstSlot.availableVehiclesCount).toBeGreaterThan(0);
    });

    it('returns 404 for non-existent showroom', async () => {
      const response = await request(app).get('/api/test-drives/availability').query({
        showroomId: 'cuid_non_existent',
        variantId,
        date: '2026-11-20',
      });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SHOWROOM_NOT_FOUND');
    });

    it('returns 422 for malformed date', async () => {
      const response = await request(app).get('/api/test-drives/availability').query({
        showroomId,
        variantId,
        date: 'invalid-date',
      });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Test-Drive Booking Creation & Idempotency
  // -------------------------------------------------------------------------
  describe('POST /api/test-drives', () => {
    it('requires DPDP consent to be true', async () => {
      const response = await request(app)
        .post('/api/test-drives')
        .send({
          showroomId,
          variantId,
          startTime: '2026-11-21T04:30:00.000Z',
          customerName: 'Aarav Sharma',
          customerPhone: '+919876543210',
          customerEmail: 'aarav.sharma@example.com',
          consentGranted: false,
          idempotencyKey: `idemp-${crypto.randomUUID()}`,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('creates a test drive booking and returns booking reference and token', async () => {
      const idempotencyKey = `idemp-td-${crypto.randomUUID()}`;
      const payload = {
        showroomId,
        variantId,
        startTime: '2026-11-21T04:30:00.000Z', // 10:00 AM IST
        customerName: 'Aarav Sharma',
        customerPhone: '+919876543210',
        customerEmail: 'aarav.sharma@example.com',
        driverLicenseNumber: 'UP32 2020 0012345',
        consentGranted: true,
        idempotencyKey,
      };

      const response = await request(app).post('/api/test-drives').send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookingReference).toMatch(/^TD-2026-[A-Z0-9]+$/);
      expect(response.body.data.confirmationToken).toBeDefined();
      expect(response.body.data.status).toBe('CONFIRMED');
      expect(response.body.data.customer.fullName).toBe('Aarav Sharma');
      expect(response.body.data.customer.email).toBe('aarav.sharma@example.com');
      expect(response.body.data.vehicle.demoRegistration).toBeDefined();

      // Test idempotency: re-sending the same payload must return the exact same booking
      const duplicateResponse = await request(app).post('/api/test-drives').send(payload);
      expect([200, 201]).toContain(duplicateResponse.status);
      expect(duplicateResponse.body.data.bookingReference).toBe(
        response.body.data.bookingReference,
      );
      expect(duplicateResponse.body.data.confirmationToken).toBe(
        response.body.data.confirmationToken,
      );
    });

    it('handles concurrent booking requests safely under race condition', async () => {
      // Find a variant that has exactly 1 demo vehicle at a showroom
      const demoVehicles = await prisma.demoVehicle.findMany({
        where: { showroomId, variantId, isActive: true },
      });
      const maxSlots = demoVehicles.length;

      const raceSlot = '2026-11-23T06:30:00.000Z'; // 12:00 PM IST

      // Fire 5 simultaneous requests at the exact same slot
      const attempts = [0, 1, 2, 3, 4].map((i) =>
        request(app)
          .post('/api/test-drives')
          .send({
            showroomId,
            variantId,
            startTime: raceSlot,
            customerName: `Race Customer ${i}`,
            customerPhone: `+91987650000${i}`,
            customerEmail: `race${i}@example.com`,
            consentGranted: true,
            idempotencyKey: `idemp-race-${i}-${crypto.randomUUID()}`,
          }),
      );

      const results = await Promise.all(attempts);
      const successful = results.filter((r) => r.status === 201 || r.status === 200);
      const rejected = results.filter((r) => r.status === 409);

      // Exactly maxSlots must succeed, and the remaining must get 409 SLOT_UNAVAILABLE
      expect(successful.length).toBe(maxSlots);
      expect(rejected.length).toBe(5 - maxSlots);
      rejected.forEach((r) => {
        expect(r.body.error.code).toBe('SLOT_UNAVAILABLE');
      });
    });

    it('rejects booking when demo vehicle capacity is exhausted for slot', async () => {
      // Find how many demo vehicles exist for this showroom & variant
      const demoCount = await prisma.demoVehicle.count({
        where: { showroomId, variantId, isActive: true },
      });

      const slotStartTime = '2026-11-22T05:30:00.000Z'; // 11:00 AM IST

      // Book up to demoCount
      for (let i = 0; i < demoCount; i++) {
        const res = await request(app)
          .post('/api/test-drives')
          .send({
            showroomId,
            variantId,
            startTime: slotStartTime,
            customerName: `Customer ${i}`,
            customerPhone: `+91987654321${i}`,
            customerEmail: `customer${i}@example.com`,
            consentGranted: true,
            idempotencyKey: `idemp-cap-${i}-${crypto.randomUUID()}`,
          });
        expect([200, 201]).toContain(res.status);
      }

      // Next booking attempt for the same slot must fail with 409 SLOT_UNAVAILABLE
      const overCapacityResponse = await request(app)
        .post('/api/test-drives')
        .send({
          showroomId,
          variantId,
          startTime: slotStartTime,
          customerName: 'Exceeded Customer',
          customerPhone: '+919999999999',
          customerEmail: 'exceeded@example.com',
          consentGranted: true,
          idempotencyKey: `idemp-overflow-${crypto.randomUUID()}`,
        });

      expect(overCapacityResponse.status).toBe(409);
      expect(overCapacityResponse.body.success).toBe(false);
      expect(overCapacityResponse.body.error.code).toBe('SLOT_UNAVAILABLE');
    });
  });

  // -------------------------------------------------------------------------
  // Services & Workshops
  // -------------------------------------------------------------------------
  describe('GET /api/services/workshops', () => {
    it('returns active workshops with operating hours', async () => {
      const response = await request(app).get('/api/services/workshops');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const gomti = response.body.data.find((w: { code: string }) => w.code === 'WS-GOMTI');
      expect(gomti).toBeDefined();
      expect(gomti.operatingHours.length).toBe(7);
      expect(gomti.slotCapacity).toBeGreaterThan(0);
    });
  });

  describe('GET /api/services/types', () => {
    it('returns active service types with pricing and duration', async () => {
      const response = await request(app).get('/api/services/types');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(5);

      const periodic = response.body.data.find(
        (t: { code: string }) => t.code === 'PERIODIC_MAINTENANCE',
      );
      expect(periodic).toBeDefined();
      expect(periodic.durationMinutes).toBe(120);
      expect(periodic.displayPrice).toContain('₹');
    });
  });

  describe('GET /api/services/availability', () => {
    it('returns available slots on an open weekday', async () => {
      // 2026-11-18 is Wednesday (Open)
      const response = await request(app).get('/api/services/availability').query({
        workshopId,
        serviceTypeId,
        date: '2026-11-18',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isOpen).toBe(true);
      expect(response.body.data.slots.length).toBeGreaterThan(0);
      expect(response.body.data.slots[0].capacityRemaining).toBeGreaterThan(0);
    });

    it('returns isOpen: false on Sunday (workshop closed)', async () => {
      // 2026-11-15 is Sunday (Closed)
      const response = await request(app).get('/api/services/availability').query({
        workshopId,
        serviceTypeId,
        date: '2026-11-15',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isOpen).toBe(false);
      expect(response.body.data.slots).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Service Booking Creation & Capacity Enforcement
  // -------------------------------------------------------------------------
  describe('POST /api/services/bookings', () => {
    it('creates a service booking and returns confirmation', async () => {
      const idempotencyKey = `idemp-srv-${crypto.randomUUID()}`;
      const payload = {
        workshopId,
        serviceTypeId,
        startTime: '2026-11-18T03:30:00.000Z', // 09:00 AM IST
        registrationNumber: 'UP32 AB 1234',
        vehicleModel: 'Vantara Lumen Petrol AT',
        vehicleYear: 2024,
        currentMileageKm: 15400,
        customerName: 'Priya Verma',
        customerPhone: '+919876512345',
        customerEmail: 'priya.verma@example.com',
        notes: 'Slight brake squeal when stopping in cold morning',
        consentGranted: true,
        idempotencyKey,
      };

      const response = await request(app).post('/api/services/bookings').send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookingReference).toMatch(/^SRV-2026-[A-Z0-9]+$/);
      expect(response.body.data.confirmationToken).toBeDefined();
      expect(response.body.data.status).toBe('CONFIRMED');
      expect(response.body.data.workshop.code).toBe('WS-GOMTI');
      expect(response.body.data.vehicle.registrationNumber).toBe('UP32 AB 1234');

      // Test idempotency
      const duplicate = await request(app).post('/api/services/bookings').send(payload);
      expect([200, 201]).toContain(duplicate.status);
      expect(duplicate.body.data.bookingReference).toBe(response.body.data.bookingReference);
    });

    it('enforces workshop slot capacity and returns 409 on overflow', async () => {
      const workshop = await prisma.workshop.findUniqueOrThrow({
        where: { id: workshopId },
      });
      const capacity = workshop.slotCapacity;

      const slotStartTime = '2026-11-19T04:30:00.000Z'; // 10:00 AM IST

      // Fill slot to capacity
      for (let i = 0; i < capacity; i++) {
        const res = await request(app)
          .post('/api/services/bookings')
          .send({
            workshopId,
            serviceTypeId,
            startTime: slotStartTime,
            registrationNumber: `UP32 TT 000${i}`,
            vehicleModel: 'Vantara Apex',
            customerName: `Service Customer ${i}`,
            customerPhone: `+91912345678${i}`,
            customerEmail: `service${i}@example.com`,
            consentGranted: true,
            idempotencyKey: `idemp-srv-cap-${i}-${crypto.randomUUID()}`,
          });
        expect([200, 201]).toContain(res.status);
      }

      // Next attempt must be rejected with 409 WORKSHOP_CAPACITY_EXCEEDED
      const overflowRes = await request(app)
        .post('/api/services/bookings')
        .send({
          workshopId,
          serviceTypeId,
          startTime: slotStartTime,
          registrationNumber: 'UP32 TT 9999',
          vehicleModel: 'Vantara Apex',
          customerName: 'Overflow Customer',
          customerPhone: '+919999911111',
          customerEmail: 'overflow@example.com',
          consentGranted: true,
          idempotencyKey: `idemp-srv-overflow-${crypto.randomUUID()}`,
        });

      expect(overflowRes.status).toBe(409);
      expect(overflowRes.body.error.code).toBe('WORKSHOP_CAPACITY_EXCEEDED');
    });
  });

  // -------------------------------------------------------------------------
  // Confirmation Lookup & Cancellation
  // -------------------------------------------------------------------------
  describe('GET /api/bookings/confirmation/:reference & Cancellation', () => {
    let bookingReference: string;
    let confirmationToken: string;

    beforeAll(async () => {
      // Create a test-drive appointment for testing lookup and cancellation
      const res = await request(app)
        .post('/api/test-drives')
        .send({
          showroomId,
          variantId,
          startTime: '2026-11-25T08:30:00.000Z', // 14:00 IST
          customerName: 'Vikram Malhotra',
          customerPhone: '+919871234567',
          customerEmail: 'vikram.m@example.com',
          consentGranted: true,
          idempotencyKey: `idemp-lookup-${crypto.randomUUID()}`,
        });

      bookingReference = res.body.data.bookingReference;
      confirmationToken = res.body.data.confirmationToken;
    });

    it('returns masked customer details when token is omitted', async () => {
      const response = await request(app).get(`/api/bookings/confirmation/${bookingReference}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isMasked).toBe(true);
      expect(response.body.data.customer.fullName).toContain('*');
      expect(response.body.data.customer.phone).toContain('*');
      expect(response.body.data.customer.email).toContain('*');
    });

    it('returns unmasked customer details when token is valid', async () => {
      const response = await request(app)
        .get(`/api/bookings/confirmation/${bookingReference}`)
        .query({ token: confirmationToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isMasked).toBe(false);
      expect(response.body.data.customer.fullName).toBe('Vikram Malhotra');
      expect(response.body.data.customer.email).toBe('vikram.m@example.com');
      expect(response.body.data.customer.phone).toBe('+919871234567');
    });

    it('rejects cancellation with wrong token', async () => {
      const response = await request(app)
        .post(`/api/bookings/${bookingReference}/cancel`)
        .send({ confirmationToken: 'wrong-token' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_CONFIRMATION_TOKEN');
    });

    it('cancels appointment with valid token and frees slot capacity', async () => {
      const cancelResponse = await request(app)
        .post(`/api/bookings/${bookingReference}/cancel`)
        .send({
          confirmationToken,
          reason: 'Schedule conflict',
        });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.status).toBe('CANCELLED');

      // Verify status is CANCELLED on lookup
      const lookup = await request(app)
        .get(`/api/bookings/confirmation/${bookingReference}`)
        .query({ token: confirmationToken });

      expect(lookup.body.data.status).toBe('CANCELLED');
      expect(lookup.body.data.canCancel).toBe(false);
    });
  });
});
