import { Router } from 'express';
import { z } from 'zod';
import { authenticateStaff, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { ContentService } from './content.service.js';

const createBannerSchema = z.object({
  headline: z.string().min(2),
  subheadline: z.string().nullable().optional(),
  badgeText: z.string().nullable().optional(),
  imageUrl: z.string().min(5),
  ctaLabel: z.string().min(1),
  ctaUrl: z.string().min(1),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  isPublished: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

const updateBannerSchema = createBannerSchema.partial();

const createOfferSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  badgeText: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  modelId: z.string().nullable().optional(),
  showroomId: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

const updateOfferSchema = createOfferSchema.partial();

export function createPublicContentRouter(
  contentService: ContentService = new ContentService(),
): Router {
  const router = Router();

  router.get('/banners', async (_req, res, next) => {
    try {
      const banners = await contentService.listPublishedBanners();
      res.json({ items: banners, total: banners.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/offers', async (_req, res, next) => {
    try {
      const offers = await contentService.listPublishedOffers();
      res.json({ items: offers, total: offers.length });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createAdminContentRouter(
  contentService: ContentService = new ContentService(),
): Router {
  const router = Router();

  router.use(authenticateStaff, requireRole('ADMIN'));

  // Banners
  router.get('/content/banners', async (_req, res, next) => {
    try {
      const items = await contentService.listAllBanners();
      res.json({ items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/content/banners', validateBody(createBannerSchema), async (req, res, next) => {
    try {
      const banner = await contentService.createBanner(req.body);
      res.status(201).json(banner);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/content/banners/:id', validateBody(updateBannerSchema), async (req, res, next) => {
    try {
      const banner = await contentService.updateBanner(req.params.id as string, req.body);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/content/banners/:id', async (req, res, next) => {
    try {
      const banner = await contentService.deleteBanner(req.params.id as string);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  });

  // Offers
  router.get('/content/offers', async (_req, res, next) => {
    try {
      const items = await contentService.listAllOffers();
      res.json({ items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.post('/content/offers', validateBody(createOfferSchema), async (req, res, next) => {
    try {
      const offer = await contentService.createOffer(req.body);
      res.status(201).json(offer);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/content/offers/:id', validateBody(updateOfferSchema), async (req, res, next) => {
    try {
      const offer = await contentService.updateOffer(req.params.id as string, req.body);
      res.json(offer);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/content/offers/:id', async (req, res, next) => {
    try {
      const offer = await contentService.deleteOffer(req.params.id as string);
      res.json(offer);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
