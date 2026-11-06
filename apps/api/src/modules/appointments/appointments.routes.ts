import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';
import crypto from 'node:crypto';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  bookingLookupParamsSchema,
  bookingLookupQuerySchema,
  cancelBookingSchema,
  createServiceBookingSchema,
  createTestDriveBookingSchema,
  serviceAvailabilityQuerySchema,
  testDriveAvailabilityQuerySchema,
} from './appointments.schemas.js';
import { BookingsService } from './bookings.service.js';
import { ServicesService } from './services.service.js';
import { TestDrivesService } from './test-drives.service.js';

function getIpHash(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export function createAppointmentsRouter(): Router {
  const router = Router();
  const testDrivesService = new TestDrivesService();
  const servicesService = new ServicesService();
  const bookingsService = new BookingsService();

  // Test-Drive Availability
  router.get(
    '/test-drives/availability',
    validateRequest({ query: testDriveAvailabilityQuerySchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const query = req.validated.query as z.infer<typeof testDriveAvailabilityQuerySchema>;
      const availability = await testDrivesService.getAvailability(query);
      sendSuccess(req, res, availability);
    }),
  );

  // Test-Drive Booking Creation
  router.post(
    '/test-drives',
    validateRequest({ body: createTestDriveBookingSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.validated.body as z.infer<typeof createTestDriveBookingSchema>;
      const ipHash = getIpHash(req);
      const confirmation = await testDrivesService.createBooking(body, ipHash);
      sendSuccess(req, res, confirmation, 201);
    }),
  );

  // Workshops Listing
  router.get(
    '/services/workshops',
    asyncHandler(async (req: Request, res: Response) => {
      const workshops = await servicesService.listWorkshops();
      sendSuccess(req, res, workshops);
    }),
  );

  // Service Types Listing
  router.get(
    '/services/types',
    asyncHandler(async (req: Request, res: Response) => {
      const types = await servicesService.listServiceTypes();
      sendSuccess(req, res, types);
    }),
  );

  // Service Availability
  router.get(
    '/services/availability',
    validateRequest({ query: serviceAvailabilityQuerySchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const query = req.validated.query as z.infer<typeof serviceAvailabilityQuerySchema>;
      const availability = await servicesService.getAvailability(query);
      sendSuccess(req, res, availability);
    }),
  );

  // Service Booking Creation
  router.post(
    '/services/bookings',
    validateRequest({ body: createServiceBookingSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.validated.body as z.infer<typeof createServiceBookingSchema>;
      const ipHash = getIpHash(req);
      const confirmation = await servicesService.createBooking(body, ipHash);
      sendSuccess(req, res, confirmation, 201);
    }),
  );

  // Booking Confirmation Lookup (Public with token masking)
  router.get(
    '/bookings/confirmation/:reference',
    validateRequest({
      params: bookingLookupParamsSchema,
      query: bookingLookupQuerySchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof bookingLookupParamsSchema>;
      const query = (req.validated.query ?? {}) as z.infer<typeof bookingLookupQuerySchema>;
      const details = await bookingsService.getBookingConfirmation(params.reference, query.token);
      sendSuccess(req, res, details);
    }),
  );

  // Booking Cancellation
  router.post(
    '/bookings/:reference/cancel',
    validateRequest({
      params: bookingLookupParamsSchema,
      body: cancelBookingSchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof bookingLookupParamsSchema>;
      const body = req.validated.body as z.infer<typeof cancelBookingSchema>;
      const result = await bookingsService.cancelBooking(params.reference, body);
      sendSuccess(req, res, result);
    }),
  );

  return router;
}
