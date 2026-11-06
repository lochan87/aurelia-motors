import type {
  CatalogueFilterQuery,
  ModelDetail,
  ModelSummary,
  OnRoadPriceBreakdown,
  PriceCalculation,
  PriceComponentBreakdown,
  PriceComponentCategory,
  PriceKind,
  ShowroomInventorySummary,
  SpecificationGroup,
  VariantDetail,
} from '@aurelia/shared';
import { computeComponentAmountPaise } from '@aurelia/shared';
import { PriceBookStatus, type Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export async function listModels(filter: CatalogueFilterQuery): Promise<ModelSummary[]> {
  const where: Prisma.VehicleModelWhereInput = {
    isActive: true,
  };

  if (filter.bodyType) {
    where.bodyType = filter.bodyType;
  }

  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { make: { contains: filter.search, mode: 'insensitive' } },
      { summary: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  if (filter.fuelType || filter.transmission) {
    where.variants = {
      some: {
        isActive: true,
        ...(filter.fuelType ? { fuelType: filter.fuelType } : {}),
        ...(filter.transmission ? { transmission: filter.transmission } : {}),
      },
    };
  }

  const models = await prisma.vehicleModel.findMany({
    where,
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          priceEntries: {
            where: {
              priceBook: {
                status: PriceBookStatus.PUBLISHED,
                effectiveFrom: { lte: new Date() },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
              },
            },
            select: {
              exShowroomPaise: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const summaries: ModelSummary[] = [];

  for (const model of models) {
    const primaryImage = model.images.find((img) => img.isPrimary) ?? model.images[0] ?? null;

    const fuelTypes = Array.from(new Set(model.variants.map((v) => v.fuelType)));
    const transmissions = Array.from(new Set(model.variants.map((v) => v.transmission)));

    const prices: number[] = [];
    for (const variant of model.variants) {
      for (const entry of variant.priceEntries) {
        prices.push(entry.exShowroomPaise);
      }
    }

    const startingPricePaise = prices.length > 0 ? Math.min(...prices) : null;

    if (filter.minPricePaise !== undefined && startingPricePaise !== null) {
      if (startingPricePaise < filter.minPricePaise) {
        continue;
      }
    }

    if (filter.maxPricePaise !== undefined && startingPricePaise !== null) {
      if (startingPricePaise > filter.maxPricePaise) {
        continue;
      }
    }

    summaries.push({
      id: model.id,
      slug: model.slug,
      make: model.make,
      name: model.name,
      bodyType: model.bodyType,
      summary: model.summary,
      primaryImage: primaryImage
        ? {
            id: primaryImage.id,
            url: primaryImage.url,
            altText: primaryImage.altText,
            caption: primaryImage.caption,
            credit: primaryImage.credit,
            width: primaryImage.width,
            height: primaryImage.height,
            isPrimary: primaryImage.isPrimary,
            sortOrder: primaryImage.sortOrder,
          }
        : null,
      startingPricePaise,
      fuelTypes,
      transmissions,
      variantCount: model.variants.length,
    });
  }

  if (filter.sort === 'price_asc') {
    summaries.sort(
      (a, b) => (a.startingPricePaise ?? Infinity) - (b.startingPricePaise ?? Infinity),
    );
  } else if (filter.sort === 'price_desc') {
    summaries.sort(
      (a, b) => (b.startingPricePaise ?? -Infinity) - (a.startingPricePaise ?? -Infinity),
    );
  } else if (filter.sort === 'name_asc') {
    summaries.sort((a, b) => a.name.localeCompare(b.name));
  }

  return summaries;
}

export async function getModelBySlug(slug: string): Promise<ModelDetail> {
  const model = await prisma.vehicleModel.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      colours: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          specifications: {
            orderBy: { sortOrder: 'asc' },
          },
          inventory: {
            include: {
              showroom: true,
            },
          },
          priceEntries: {
            where: {
              priceBook: {
                status: PriceBookStatus.PUBLISHED,
                effectiveFrom: { lte: new Date() },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
              },
            },
            select: {
              exShowroomPaise: true,
            },
          },
        },
      },
    },
  });

  if (!model || !model.isActive) {
    throw new AppError(404, 'MODEL_NOT_FOUND', `Vehicle model '${slug}' was not found.`);
  }

  const showrooms = await prisma.showroom.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const variants: VariantDetail[] = model.variants.map((variant) => {
    const prices = variant.priceEntries.map((p) => p.exShowroomPaise);
    const startingPricePaise = prices.length > 0 ? Math.min(...prices) : null;

    const inventoryByShowroom: ShowroomInventorySummary[] = showrooms.map((showroom) => {
      const units = variant.inventory.filter((inv) => inv.showroomId === showroom.id);
      return {
        showroomId: showroom.id,
        showroomCode: showroom.code,
        showroomName: showroom.name,
        availableCount: units.filter((u) => u.status === 'AVAILABLE').length,
        reservedCount: units.filter((u) => u.status === 'RESERVED').length,
        inTransitCount: units.filter((u) => u.status === 'IN_TRANSIT').length,
        totalCount: units.length,
      };
    });

    return {
      id: variant.id,
      slug: variant.slug,
      name: variant.name,
      fuelType: variant.fuelType,
      transmission: variant.transmission,
      engineCapacityCc: variant.engineCapacityCc,
      powerBhp: variant.powerBhp,
      torqueNm: variant.torqueNm,
      seatingCapacity: variant.seatingCapacity,
      sortOrder: variant.sortOrder,
      startingPricePaise,
      specifications: variant.specifications.map((s) => ({
        id: s.id,
        group: s.group as SpecificationGroup,
        label: s.label,
        value: s.value,
        sortOrder: s.sortOrder,
      })),
      inventory: inventoryByShowroom,
    };
  });

  const allModelPrices = variants
    .map((v) => v.startingPricePaise)
    .filter((p): p is number => p !== null);
  const startingPricePaise = allModelPrices.length > 0 ? Math.min(...allModelPrices) : null;

  return {
    id: model.id,
    slug: model.slug,
    make: model.make,
    name: model.name,
    bodyType: model.bodyType,
    summary: model.summary,
    description: model.description,
    startingPricePaise,
    images: model.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      caption: img.caption,
      credit: img.credit,
      width: img.width,
      height: img.height,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    colours: model.colours.map((col) => ({
      id: col.id,
      name: col.name,
      hexCode: col.hexCode,
      finish: col.finish,
      sortOrder: col.sortOrder,
    })),
    variants,
  };
}

export async function getVariantPricing(
  variantSlug: string,
  showroomIdentifier: { showroomCode?: string; showroomId?: string },
): Promise<OnRoadPriceBreakdown> {
  const variant = await prisma.vehicleVariant.findUnique({
    where: { slug: variantSlug },
    include: { model: true },
  });

  if (!variant || !variant.isActive || !variant.model.isActive) {
    throw new AppError(404, 'VARIANT_NOT_FOUND', `Vehicle variant '${variantSlug}' was not found.`);
  }

  let showroom;
  if (showroomIdentifier.showroomId) {
    showroom = await prisma.showroom.findUnique({
      where: { id: showroomIdentifier.showroomId },
    });
  } else if (showroomIdentifier.showroomCode) {
    showroom = await prisma.showroom.findUnique({
      where: { code: showroomIdentifier.showroomCode.toUpperCase() },
    });
  } else {
    showroom = await prisma.showroom.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  if (!showroom || !showroom.isActive) {
    throw new AppError(
      404,
      'SHOWROOM_NOT_FOUND',
      'The requested showroom was not found or is currently inactive.',
    );
  }

  const now = new Date();
  const priceBook = await prisma.priceBook.findFirst({
    where: {
      status: PriceBookStatus.PUBLISHED,
      showroomId: showroom.id,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!priceBook) {
    throw new AppError(
      404,
      'PRICING_NOT_FOUND',
      `No published price book is currently active for ${showroom.name}.`,
    );
  }

  const entry = await prisma.priceEntry.findUnique({
    where: {
      priceBookId_variantId: {
        priceBookId: priceBook.id,
        variantId: variant.id,
      },
    },
    include: {
      components: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!entry) {
    throw new AppError(
      404,
      'PRICING_NOT_FOUND',
      `Price for ${variant.model.name} ${variant.name} is currently on request at ${showroom.name}.`,
    );
  }

  const exShowroomPaise = entry.exShowroomPaise;
  const mandatoryComponents: PriceComponentBreakdown[] = [];
  const optionalComponents: PriceComponentBreakdown[] = [];

  for (const comp of entry.components) {
    const amountPaise = computeComponentAmountPaise(
      exShowroomPaise,
      comp.calculation as PriceCalculation,
      comp.amountPaise,
      comp.rateBasisPoints,
    );

    const breakdown: PriceComponentBreakdown = {
      code: comp.code,
      label: comp.label,
      category: comp.category as PriceComponentCategory,
      calculation: comp.calculation as PriceCalculation,
      isOptional: comp.isOptional,
      sortOrder: comp.sortOrder,
      rateBasisPoints: comp.rateBasisPoints,
      amountPaise,
    };

    if (comp.isOptional) {
      optionalComponents.push(breakdown);
    } else {
      mandatoryComponents.push(breakdown);
    }
  }

  const mandatoryTotalPaise = mandatoryComponents.reduce((sum, c) => sum + c.amountPaise, 0);
  const optionalTotalPaise = optionalComponents.reduce((sum, c) => sum + c.amountPaise, 0);
  const standardOnRoadPricePaise = exShowroomPaise + mandatoryTotalPaise;
  const totalWithOptionsPaise = standardOnRoadPricePaise + optionalTotalPaise;

  return {
    priceBookCode: priceBook.code,
    priceBookName: priceBook.name,
    variantId: variant.id,
    variantSlug: variant.slug,
    variantName: variant.name,
    showroomId: showroom.id,
    showroomCode: showroom.code,
    showroomName: showroom.name,
    priceKind: entry.priceKind as PriceKind,
    exShowroomPaise,
    mandatoryComponents,
    optionalComponents,
    mandatoryTotalPaise,
    standardOnRoadPricePaise,
    totalWithOptionsPaise,
    notes: entry.notes ?? priceBook.notes,
  };
}
