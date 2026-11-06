import { Router } from 'express';
import { z } from 'zod';
import type { ProposalStatus } from '@prisma/client';
import { authenticateStaff, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { AppError } from '../../lib/errors.js';
import { UsedCarPricingService } from './used-car-pricing.service.js';

const proposePriceSchema = z.object({
  proposedPricePaise: z.number().int().positive(),
  reason: z.string().min(5),
});

const approveProposalSchema = z
  .object({
    reviewNotes: z.string().optional(),
  })
  .default({});

const rejectProposalSchema = z.object({
  reviewNotes: z.string().min(3),
});

export function createUsedCarPricingRouter(
  service: UsedCarPricingService = new UsedCarPricingService(),
): Router {
  const router = Router();

  // All endpoints require authenticated staff
  router.use(authenticateStaff);

  // Propose price change: allowed by USED_CAR_STAFF and ADMIN
  router.post(
    '/used-vehicles/:id/propose-price',
    requireRole('USED_CAR_STAFF', 'ADMIN'),
    validateBody(proposePriceSchema),
    async (req, res, next) => {
      try {
        if (!req.staffUser) {
          throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }
        const id = req.params.id as string;
        const proposal = await service.proposePrice(id, req.body, req.staffUser);
        res.status(201).json(proposal);
      } catch (err) {
        next(err);
      }
    },
  );

  // List proposals: allowed by USED_CAR_STAFF and ADMIN
  router.get(
    '/used-car-pricing/proposals',
    requireRole('USED_CAR_STAFF', 'ADMIN'),
    async (req, res, next) => {
      try {
        const status =
          typeof req.query.status === 'string' ? (req.query.status as ProposalStatus) : undefined;
        const usedVehicleId =
          typeof req.query.usedVehicleId === 'string' ? req.query.usedVehicleId : undefined;
        const items = await service.listProposals({ status, usedVehicleId });
        res.json({ items, total: items.length });
      } catch (err) {
        next(err);
      }
    },
  );

  // Approve proposal: allowed by ADMIN only
  router.post(
    '/used-car-pricing/proposals/:id/approve',
    requireRole('ADMIN'),
    validateBody(approveProposalSchema),
    async (req, res, next) => {
      try {
        if (!req.staffUser) {
          throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }
        const id = req.params.id as string;
        const proposal = await service.approveProposal(id, req.staffUser, req.body);
        res.json(proposal);
      } catch (err) {
        next(err);
      }
    },
  );

  // Reject proposal: allowed by ADMIN only
  router.post(
    '/used-car-pricing/proposals/:id/reject',
    requireRole('ADMIN'),
    validateBody(rejectProposalSchema),
    async (req, res, next) => {
      try {
        if (!req.staffUser) {
          throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }
        const id = req.params.id as string;
        const proposal = await service.rejectProposal(id, req.staffUser, req.body);
        res.json(proposal);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
