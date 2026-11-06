import { Router } from 'express';
import { z } from 'zod';
import {
  BodyType,
  FuelType,
  StockStatus,
  Transmission,
  PriceComponentCategory,
  PriceCalculation,
} from '@prisma/client';
import { authenticateStaff, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { CmsService } from './cms.service.js';

const createModelSchema = z.object({
  name: z.string().min(2),
  make: z.string().min(2),
  slug: z.string().min(2),
  bodyType: z.nativeEnum(BodyType),
  summary: z.string().min(5),
  description: z.string().min(10),
});

const updateModelSchema = z.object({
  name: z.string().min(2).optional(),
  make: z.string().min(2).optional(),
  bodyType: z.nativeEnum(BodyType).optional(),
  summary: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
  isActive: z.boolean().optional(),
});

const createVariantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  fuelType: z.nativeEnum(FuelType),
  transmission: z.nativeEnum(Transmission),
  engineCapacityCc: z.number().int().positive().optional(),
  powerBhp: z.number().int().positive().optional(),
  torqueNm: z.number().int().positive().optional(),
  seatingCapacity: z.number().int().positive().default(5),
  sortOrder: z.number().int().default(0),
});

const updateVariantSchema = z.object({
  name: z.string().min(2).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  engineCapacityCc: z.number().int().positive().optional(),
  powerBhp: z.number().int().positive().optional(),
  torqueNm: z.number().int().positive().optional(),
  seatingCapacity: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const createInventorySchema = z.object({
  showroomId: z.string().min(1),
  variantId: z.string().min(1),
  colourId: z.string().optional(),
  stockNumber: z.string().min(3),
  manufactureYear: z.number().int().min(2020).max(2027).optional(),
  odometerKm: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(StockStatus).optional(),
});

const updateInventorySchema = z.object({
  status: z.nativeEnum(StockStatus).optional(),
  showroomId: z.string().min(1).optional(),
});

const createPriceBookSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  showroomId: z.string().nullable().optional(),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const upsertPriceEntrySchema = z.object({
  exShowroomPaise: z.number().int().positive(),
  components: z.array(
    z.object({
      code: z.string().min(2),
      label: z.string().min(2),
      category: z.nativeEnum(PriceComponentCategory),
      calculation: z.nativeEnum(PriceCalculation),
      amountPaise: z.number().int().nonnegative().optional(),
      rateBasisPoints: z.number().int().nonnegative().optional(),
      isOptional: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    }),
  ),
});

export function createAdminCmsRouter(cmsService: CmsService = new CmsService()): Router {
  const router = Router();

  // All endpoints require authenticated ADMIN role
  router.use(authenticateStaff, requireRole('ADMIN'));

  // -------------------------------------------------------------------------
  // Models
  // -------------------------------------------------------------------------
  router.get('/cms/models', async (_req, res, next) => {
    try {
      const models = await cmsService.listModels();
      res.json({ items: models, total: models.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/cms/models/:id', async (req, res, next) => {
    try {
      const model = await cmsService.getModelById(req.params.id as string);
      res.json(model);
    } catch (err) {
      next(err);
    }
  });

  router.post('/cms/models', validateBody(createModelSchema), async (req, res, next) => {
    try {
      const model = await cmsService.createModel(req.body);
      res.status(201).json(model);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/cms/models/:id', validateBody(updateModelSchema), async (req, res, next) => {
    try {
      const model = await cmsService.updateModel(req.params.id as string, req.body);
      res.json(model);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/cms/models/:id', async (req, res, next) => {
    try {
      const model = await cmsService.deactivateModel(req.params.id as string);
      res.json(model);
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Variants
  // -------------------------------------------------------------------------
  router.post(
    '/cms/models/:modelId/variants',
    validateBody(createVariantSchema),
    async (req, res, next) => {
      try {
        const variant = await cmsService.createVariant({
          ...req.body,
          modelId: req.params.modelId as string,
        });
        res.status(201).json(variant);
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch('/cms/variants/:id', validateBody(updateVariantSchema), async (req, res, next) => {
    try {
      const variant = await cmsService.updateVariant(req.params.id as string, req.body);
      res.json(variant);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/cms/variants/:id', async (req, res, next) => {
    try {
      const variant = await cmsService.deactivateVariant(req.params.id as string);
      res.json(variant);
    } catch (err) {
      next(err);
    }
  });

  // -------------------------------------------------------------------------
  // Inventory
  // -------------------------------------------------------------------------
  router.get('/cms/inventory', async (req, res, next) => {
    try {
      const showroomId =
        typeof req.query.showroomId === 'string' ? req.query.showroomId : undefined;
      const status =
        typeof req.query.status === 'string' ? (req.query.status as StockStatus) : undefined;
      const items = await cmsService.listInventory({ showroomId, status });
      res.json({ items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/cms/inventory', validateBody(createInventorySchema), async (req, res, next) => {
    try {
      const unit = await cmsService.createInventoryUnit(req.body);
      res.status(201).json(unit);
    } catch (err) {
      next(err);
    }
  });

  router.patch(
    '/cms/inventory/:id',
    validateBody(updateInventorySchema),
    async (req, res, next) => {
      try {
        const unit = await cmsService.updateInventoryUnit(req.params.id as string, req.body);
        res.json(unit);
      } catch (err) {
        next(err);
      }
    },
  );

  // -------------------------------------------------------------------------
  // Price Books
  // -------------------------------------------------------------------------
  router.get('/cms/price-books', async (_req, res, next) => {
    try {
      const books = await cmsService.listPriceBooks();
      res.json({ items: books, total: books.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/cms/price-books/:id', async (req, res, next) => {
    try {
      const book = await cmsService.getPriceBookById(req.params.id as string);
      res.json(book);
    } catch (err) {
      next(err);
    }
  });

  router.post('/cms/price-books', validateBody(createPriceBookSchema), async (req, res, next) => {
    try {
      const book = await cmsService.createPriceBook(req.body);
      res.status(201).json(book);
    } catch (err) {
      next(err);
    }
  });

  router.put(
    '/cms/price-books/:id/entries/:variantId',
    validateBody(upsertPriceEntrySchema),
    async (req, res, next) => {
      try {
        const entry = await cmsService.upsertPriceEntry(req.params.id as string, {
          variantId: req.params.variantId as string,
          ...req.body,
        });
        res.json(entry);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post('/cms/price-books/:id/publish', async (req, res, next) => {
    try {
      const book = await cmsService.publishPriceBook(req.params.id as string);
      res.json(book);
    } catch (err) {
      next(err);
    }
  });

  router.post('/cms/price-books/:id/archive', async (req, res, next) => {
    try {
      const book = await cmsService.archivePriceBook(req.params.id as string);
      res.json(book);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
