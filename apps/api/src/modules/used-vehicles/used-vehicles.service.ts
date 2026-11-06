import type {
  InspectionRating,
  PaginatedResult,
  UsedInspectionReport,
  UsedVehicleDetail,
  UsedVehicleFilterQuery,
  UsedVehicleSummary,
} from '@aurelia/shared';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export async function listUsedVehicles(
  filter: UsedVehicleFilterQuery,
): Promise<PaginatedResult<UsedVehicleSummary>> {
  const where: Prisma.UsedVehicleWhereInput = {};

  if (filter.make) {
    where.make = { contains: filter.make, mode: 'insensitive' };
  }

  if (filter.fuelType) {
    where.fuelType = filter.fuelType;
  }

  if (filter.transmission) {
    where.transmission = filter.transmission;
  }

  if (filter.minYear !== undefined || filter.maxYear !== undefined) {
    where.registrationYear = {
      ...(filter.minYear !== undefined ? { gte: filter.minYear } : {}),
      ...(filter.maxYear !== undefined ? { lte: filter.maxYear } : {}),
    };
  }

  if (filter.minMileageKm !== undefined || filter.maxMileageKm !== undefined) {
    where.mileageKm = {
      ...(filter.minMileageKm !== undefined ? { gte: filter.minMileageKm } : {}),
      ...(filter.maxMileageKm !== undefined ? { lte: filter.maxMileageKm } : {}),
    };
  }

  if (filter.minPricePaise !== undefined || filter.maxPricePaise !== undefined) {
    where.pricePaise = {
      ...(filter.minPricePaise !== undefined ? { gte: filter.minPricePaise } : {}),
      ...(filter.maxPricePaise !== undefined ? { lte: filter.maxPricePaise } : {}),
    };
  }

  if (filter.showroomCode) {
    where.showroom = { code: filter.showroomCode.toUpperCase() };
  } else if (filter.showroomId) {
    where.showroomId = filter.showroomId;
  }

  if (filter.search) {
    where.OR = [
      { make: { contains: filter.search, mode: 'insensitive' } },
      { modelName: { contains: filter.search, mode: 'insensitive' } },
      { variantName: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
      { registrationNumberMasked: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.UsedVehicleOrderByWithRelationInput[] = [];
  if (filter.sort === 'price_asc') {
    orderBy.push({ pricePaise: 'asc' });
  } else if (filter.sort === 'price_desc') {
    orderBy.push({ pricePaise: 'desc' });
  } else if (filter.sort === 'mileage_asc') {
    orderBy.push({ mileageKm: 'asc' });
  } else if (filter.sort === 'year_desc') {
    orderBy.push({ registrationYear: 'desc' });
  } else {
    orderBy.push({ registrationYear: 'desc' }, { createdAt: 'desc' });
  }

  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const pageSize = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : 12;
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [total, rows] = await Promise.all([
    prisma.usedVehicle.count({ where }),
    prisma.usedVehicle.findMany({
      where,
      include: {
        showroom: true,
        model: true,
        inspections: {
          where: { isCurrent: true },
          take: 1,
        },
      },
      orderBy,
      skip,
      take,
    }),
  ]);

  const items: UsedVehicleSummary[] = rows.map((row) => {
    const currentInspection = row.inspections[0];
    const thumbnailPlaceholderUrl = row.model?.slug
      ? `/images/vehicles/${row.model.slug}-exterior.svg`
      : '/images/vehicles/vantara-lumen-exterior.svg';

    return {
      id: row.id,
      slug: row.slug,
      make: row.make,
      modelName: row.modelName,
      variantName: row.variantName,
      registrationYear: row.registrationYear,
      registrationMonth: row.registrationMonth,
      mileageKm: row.mileageKm,
      fuelType: row.fuelType,
      transmission: row.transmission,
      ownershipCount: row.ownershipCount,
      colourName: row.colourName,
      pricePaise: row.pricePaise,
      stockStatus: row.stockStatus,
      certified: row.certified,
      registrationNumberMasked: row.registrationNumberMasked,
      overallScore: currentInspection?.overallScore ?? null,
      showroom: {
        id: row.showroom.id,
        code: row.showroom.code,
        name: row.showroom.name,
        city: row.showroom.city,
      },
      thumbnailPlaceholderUrl,
    };
  });

  return {
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getUsedVehicleBySlug(slug: string): Promise<UsedVehicleDetail> {
  const row = await prisma.usedVehicle.findUnique({
    where: { slug },
    include: {
      showroom: true,
      model: true,
      variant: true,
      inspections: {
        where: { isCurrent: true },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });

  if (!row) {
    throw new AppError(404, 'USED_VEHICLE_NOT_FOUND', `Used vehicle '${slug}' was not found.`);
  }

  const currentInspection = row.inspections[0] ?? null;
  const inspection: UsedInspectionReport | null = currentInspection
    ? {
        id: currentInspection.id,
        version: currentInspection.version,
        inspectedAt: currentInspection.inspectedAt.toISOString(),
        inspectorName: currentInspection.inspectorName,
        overallScore: currentInspection.overallScore,
        summary: currentInspection.summary,
        reportReference: currentInspection.reportReference,
        items: currentInspection.items.map((item) => ({
          id: item.id,
          category: item.category,
          label: item.label,
          rating: item.rating as InspectionRating,
          notes: item.notes,
          sortOrder: item.sortOrder,
        })),
      }
    : null;

  const thumbnailPlaceholderUrl = row.model?.slug
    ? `/images/vehicles/${row.model.slug}-exterior.svg`
    : '/images/vehicles/vantara-lumen-exterior.svg';

  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    modelName: row.modelName,
    variantName: row.variantName,
    registrationYear: row.registrationYear,
    registrationMonth: row.registrationMonth,
    mileageKm: row.mileageKm,
    fuelType: row.fuelType,
    transmission: row.transmission,
    ownershipCount: row.ownershipCount,
    colourName: row.colourName,
    pricePaise: row.pricePaise,
    stockStatus: row.stockStatus,
    certified: row.certified,
    registrationNumberMasked: row.registrationNumberMasked,
    overallScore: currentInspection?.overallScore ?? null,
    description: row.description,
    highlights: row.highlights,
    inspection,
    modelSlug: row.model?.slug ?? null,
    variantSlug: row.variant?.slug ?? null,
    showroom: {
      id: row.showroom.id,
      code: row.showroom.code,
      name: row.showroom.name,
      city: row.showroom.city,
    },
    thumbnailPlaceholderUrl,
  };
}
