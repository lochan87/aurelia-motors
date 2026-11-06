import { Router } from 'express';
import { z } from 'zod';
import { TradeInStatus, VehicleCondition } from '@prisma/client';
import { authenticateStaff, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { AppError } from '../../lib/errors.js';
import { TradeInsService } from './trade-ins.service.js';

const estimateSchema = z.object({
  make: z.string().min(2),
  model: z.string().min(2),
  registrationYear: z.number().int().min(2005).max(2026),
  mileageKm: z.number().int().nonnegative(),
  condition: z.nativeEnum(VehicleCondition),
  ownershipCount: z.number().int().positive().optional(),
});

const createTradeInSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  showroomId: z.string().min(1),
  make: z.string().min(2),
  model: z.string().min(2),
  variant: z.string().optional(),
  registrationYear: z.number().int().min(2005).max(2026),
  mileageKm: z.number().int().nonnegative(),
  ownershipCount: z.number().int().positive().default(1),
  condition: z.nativeEnum(VehicleCondition),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  customerNotes: z.string().optional(),
  privacyConsent: z.boolean(),
});

const updateTradeInSchema = z.object({
  status: z.nativeEnum(TradeInStatus).optional(),
  offeredValuationPaise: z.number().int().positive().optional(),
  staffNotes: z.string().optional(),
});

export function createPublicTradeInsRouter(
  service: TradeInsService = new TradeInsService(),
): Router {
  const router = Router();

  router.post('/estimate', validateBody(estimateSchema), async (req, res, next) => {
    try {
      const result = service.calculateEstimate(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', validateBody(createTradeInSchema), async (req, res, next) => {
    try {
      const result = await service.createTradeInRequest(req.body, {
        ipHash: req.ip,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createStaffTradeInsRouter(
  service: TradeInsService = new TradeInsService(),
): Router {
  const router = Router();

  router.use(authenticateStaff);

  router.get(
    '/',
    requireRole('ADMIN', 'USED_CAR_STAFF', 'SALES_CONSULTANT'),
    async (req, res, next) => {
      try {
        if (!req.staffUser) {
          throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }
        const status =
          typeof req.query.status === 'string' ? (req.query.status as TradeInStatus) : undefined;
        const items = await service.listTradeIns(req.staffUser, { status });
        res.json({ items, total: items.length });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get(
    '/:id',
    requireRole('ADMIN', 'USED_CAR_STAFF', 'SALES_CONSULTANT'),
    async (req, res, next) => {
      try {
        if (!req.staffUser) {
          throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }
        const id = req.params.id as string;
        const item = await service.getTradeInById(id, req.staffUser);
        res.json(item);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch(
    '/:id',
    requireRole('ADMIN', 'USED_CAR_STAFF'),
    validateBody(updateTradeInSchema),
    async (req, res, next) => {
      try {
        if (!req.staffUser) {
          throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }
        const id = req.params.id as string;
        const item = await service.updateTradeIn(id, req.body, req.staffUser);
        res.json(item);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
