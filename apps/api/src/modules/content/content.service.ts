import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export interface CreateBannerInput {
  headline: string;
  subheadline?: string | null;
  badgeText?: string | null;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  startDate?: string | null;
  endDate?: string | null;
  isPublished?: boolean;
  displayOrder?: number;
}

export interface UpdateBannerInput {
  headline?: string;
  subheadline?: string | null;
  badgeText?: string | null;
  imageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  startDate?: string | null;
  endDate?: string | null;
  isPublished?: boolean;
  displayOrder?: number;
}

export interface CreateOfferInput {
  title: string;
  description: string;
  badgeText?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startDate: string;
  endDate: string;
  modelId?: string | null;
  showroomId?: string | null;
  isPublished?: boolean;
  displayOrder?: number;
}

export interface UpdateOfferInput {
  title?: string;
  description?: string;
  badgeText?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startDate?: string;
  endDate?: string;
  modelId?: string | null;
  showroomId?: string | null;
  isPublished?: boolean;
  displayOrder?: number;
}

export class ContentService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  // ---------------------------------------------------------------------------
  // Homepage Banners
  // ---------------------------------------------------------------------------

  async listPublishedBanners() {
    const now = new Date();
    return this.prisma.homepageBanner.findMany({
      where: {
        isPublished: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async listAllBanners() {
    return this.prisma.homepageBanner.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createBanner(input: CreateBannerInput) {
    return this.prisma.homepageBanner.create({
      data: {
        headline: input.headline.trim(),
        subheadline: input.subheadline?.trim() || null,
        badgeText: input.badgeText?.trim() || null,
        imageUrl: input.imageUrl.trim(),
        ctaLabel: input.ctaLabel.trim(),
        ctaUrl: input.ctaUrl.trim(),
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        isPublished: input.isPublished ?? true,
        displayOrder: input.displayOrder ?? 0,
      },
    });
  }

  async updateBanner(id: string, input: UpdateBannerInput) {
    const existing = await this.prisma.homepageBanner.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'BANNER_NOT_FOUND', `Banner '${id}' not found`);
    }

    return this.prisma.homepageBanner.update({
      where: { id },
      data: {
        ...(input.headline !== undefined && { headline: input.headline.trim() }),
        ...(input.subheadline !== undefined && { subheadline: input.subheadline?.trim() || null }),
        ...(input.badgeText !== undefined && { badgeText: input.badgeText?.trim() || null }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl.trim() }),
        ...(input.ctaLabel !== undefined && { ctaLabel: input.ctaLabel.trim() }),
        ...(input.ctaUrl !== undefined && { ctaUrl: input.ctaUrl.trim() }),
        ...(input.startDate !== undefined && {
          startDate: input.startDate ? new Date(input.startDate) : null,
        }),
        ...(input.endDate !== undefined && {
          endDate: input.endDate ? new Date(input.endDate) : null,
        }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      },
    });
  }

  async deleteBanner(id: string) {
    const existing = await this.prisma.homepageBanner.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'BANNER_NOT_FOUND', `Banner '${id}' not found`);
    }

    return this.prisma.homepageBanner.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Promotion Offers
  // ---------------------------------------------------------------------------

  async listPublishedOffers() {
    const now = new Date();
    return this.prisma.promotionOffer.findMany({
      where: {
        isPublished: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        vehicleModel: { select: { id: true, name: true, slug: true } },
        showroom: { select: { id: true, name: true, code: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async listAllOffers() {
    return this.prisma.promotionOffer.findMany({
      include: {
        vehicleModel: { select: { id: true, name: true, slug: true } },
        showroom: { select: { id: true, name: true, code: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createOffer(input: CreateOfferInput) {
    return this.prisma.promotionOffer.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        badgeText: input.badgeText?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        ctaLabel: input.ctaLabel?.trim() || null,
        ctaUrl: input.ctaUrl?.trim() || null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        modelId: input.modelId || null,
        showroomId: input.showroomId || null,
        isPublished: input.isPublished ?? true,
        displayOrder: input.displayOrder ?? 0,
      },
      include: {
        vehicleModel: { select: { id: true, name: true, slug: true } },
        showroom: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async updateOffer(id: string, input: UpdateOfferInput) {
    const existing = await this.prisma.promotionOffer.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'OFFER_NOT_FOUND', `Offer '${id}' not found`);
    }

    return this.prisma.promotionOffer.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.badgeText !== undefined && { badgeText: input.badgeText?.trim() || null }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl?.trim() || null }),
        ...(input.ctaLabel !== undefined && { ctaLabel: input.ctaLabel?.trim() || null }),
        ...(input.ctaUrl !== undefined && { ctaUrl: input.ctaUrl?.trim() || null }),
        ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
        ...(input.endDate !== undefined && { endDate: new Date(input.endDate) }),
        ...(input.modelId !== undefined && { modelId: input.modelId || null }),
        ...(input.showroomId !== undefined && { showroomId: input.showroomId || null }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      },
      include: {
        vehicleModel: { select: { id: true, name: true, slug: true } },
        showroom: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async deleteOffer(id: string) {
    const existing = await this.prisma.promotionOffer.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'OFFER_NOT_FOUND', `Offer '${id}' not found`);
    }

    return this.prisma.promotionOffer.delete({ where: { id } });
  }
}
