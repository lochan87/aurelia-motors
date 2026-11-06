import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';
import type { LeadSource } from '@prisma/client';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticateStaff, requireRole, verifyCsrf } from '../../middleware/auth.js';
import { enquiryRateLimiter } from '../../middleware/rate-limit.js';
import { validateRequest } from '../../middleware/validate.js';
import { LeadAssignmentService } from './lead-assignment.service.js';
import { LeadImportService } from './lead-import.service.js';
import {
  addLeadNoteSchema,
  createEnquirySchema,
  executeImportSchema,
  leadFilterSchema,
  leadParamsSchema,
  reassignLeadSchema,
  recordContactActivitySchema,
  updateLeadStatusSchema,
} from './leads.schemas.js';
import { LeadsService } from './leads.service.js';

function getIpHash(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Public Enquiries router (mounted at /api/enquiries)
 */
export function createPublicEnquiriesRouter(): Router {
  const router = Router();
  const leadsService = new LeadsService();

  router.post(
    '/',
    enquiryRateLimiter,
    validateRequest({ body: createEnquirySchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.validated.body as z.infer<typeof createEnquirySchema>;
      const ipHash = getIpHash(req);
      const userAgent = req.header('user-agent');

      const result = await leadsService.createPublicEnquiry(body, { ipHash, userAgent });
      sendSuccess(req, res, result, 201);
    }),
  );

  return router;
}

/**
 * Staff CRM router (mounted at /api/staff/leads)
 */
export function createStaffLeadsRouter(): Router {
  const router = Router();
  const leadsService = new LeadsService();
  const assignmentService = new LeadAssignmentService();
  const importService = new LeadImportService();

  // All CRM endpoints require staff authentication
  router.use(authenticateStaff);

  // GET /api/staff/leads/metrics - Aggregated metrics with location scoping
  router.get(
    '/metrics',
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const metrics = await leadsService.getLeadMetrics(req.staffUser);
      sendSuccess(req, res, metrics);
    }),
  );

  // GET /api/staff/leads/imports - List batch imports (Admin only)
  router.get(
    '/imports',
    requireRole('ADMIN'),
    asyncHandler(async (req: Request, res: Response) => {
      const batches = await importService.listImportBatches();
      sendSuccess(req, res, batches);
    }),
  );

  // POST /api/staff/leads/import/preview - Preview CSV rows before execution
  router.post(
    '/import/preview',
    verifyCsrf,
    requireRole('ADMIN'),
    asyncHandler(async (req: Request, res: Response) => {
      const csvText = typeof req.body === 'string' ? req.body : req.body.csvText;
      if (!csvText || typeof csvText !== 'string') {
        sendSuccess(req, res, { error: 'No CSV payload provided' }, 400);
        return;
      }
      const preview = await importService.previewCsv(csvText);
      sendSuccess(req, res, preview);
    }),
  );

  // POST /api/staff/leads/import - Execute CSV import (Admin only)
  router.post(
    '/import',
    verifyCsrf,
    requireRole('ADMIN'),
    validateRequest({ body: executeImportSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const body = req.validated.body as z.infer<typeof executeImportSchema>;
      const result = await importService.executeImport(
        body.filename,
        body.source as LeadSource,
        body.rows,
        req.staffUser,
      );
      sendSuccess(req, res, result, 201);
    }),
  );

  // GET /api/staff/leads - List leads with filters, pagination, location scoping
  router.get(
    '/',
    validateRequest({ query: leadFilterSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const query = (req.validated.query || {}) as z.infer<typeof leadFilterSchema>;
      const results = await leadsService.listLeads(req.staffUser, query);
      sendSuccess(req, res, results);
    }),
  );

  // GET /api/staff/leads/:id - Get lead details with audit timeline and notes
  router.get(
    '/:id',
    validateRequest({ params: leadParamsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const params = req.validated.params as z.infer<typeof leadParamsSchema>;
      const lead = await leadsService.getLeadById(params.id, req.staffUser);
      sendSuccess(req, res, lead);
    }),
  );

  // PATCH /api/staff/leads/:id/status - Update lead status
  router.patch(
    '/:id/status',
    verifyCsrf,
    validateRequest({
      params: leadParamsSchema,
      body: updateLeadStatusSchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const params = req.validated.params as z.infer<typeof leadParamsSchema>;
      const body = req.validated.body as z.infer<typeof updateLeadStatusSchema>;
      const updated = await leadsService.updateLeadStatus(params.id, body, req.staffUser);
      sendSuccess(req, res, updated);
    }),
  );

  // POST /api/staff/leads/:id/notes - Add internal note
  router.post(
    '/:id/notes',
    verifyCsrf,
    validateRequest({
      params: leadParamsSchema,
      body: addLeadNoteSchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const params = req.validated.params as z.infer<typeof leadParamsSchema>;
      const body = req.validated.body as z.infer<typeof addLeadNoteSchema>;
      await leadsService.addLeadNote(params.id, body, req.staffUser);
      sendSuccess(req, res, { message: 'Note added successfully' }, 201);
    }),
  );

  // POST /api/staff/leads/:id/activities - Record contact activity (first response establish)
  router.post(
    '/:id/activities',
    verifyCsrf,
    validateRequest({
      params: leadParamsSchema,
      body: recordContactActivitySchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const params = req.validated.params as z.infer<typeof leadParamsSchema>;
      const body = req.validated.body as z.infer<typeof recordContactActivitySchema>;
      await leadsService.recordContactActivity(params.id, body, req.staffUser);
      sendSuccess(req, res, { message: 'Contact activity recorded successfully' }, 201);
    }),
  );

  // PATCH /api/staff/leads/:id/assignment - Reassign lead (Admin only)
  router.patch(
    '/:id/assignment',
    verifyCsrf,
    requireRole('ADMIN'),
    validateRequest({
      params: leadParamsSchema,
      body: reassignLeadSchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) return;
      const params = req.validated.params as z.infer<typeof leadParamsSchema>;
      const body = req.validated.body as z.infer<typeof reassignLeadSchema>;
      await assignmentService.reassignLead(params.id, body.staffUserId, req.staffUser, body.reason);
      sendSuccess(req, res, { message: 'Lead reassigned successfully' });
    }),
  );

  return router;
}
