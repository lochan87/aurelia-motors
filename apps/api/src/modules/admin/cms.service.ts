import type {
  BodyType,
  FuelType,
  PriceCalculation,
  PriceComponentCategory,
  PrismaClient,
  SpecificationGroup,
  Transmission,
} from '@prisma/client';
import { PriceBookStatus, PriceKind, StockStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export interface CreateModelInput {
  name: string;
  make: string;
  slug: string;
  bodyType: BodyType;
  summary: string;
  description: string;
}

export interface UpdateModelInput {
  name?: string;
  make?: string;
  bodyType?: BodyType;
  summary?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateVariantInput {
  modelId: string;
  name: string;
  slug: string;
  fuelType: FuelType;
  transmission: Transmission;
  engineCapacityCc?: number;
  powerBhp?: number;
  torqueNm?: number;
  seatingCapacity?: number;
  sortOrder?: number;
}

export interface UpdateVariantInput {
  name?: string;
  fuelType?: FuelType;
  transmission?: Transmission;
  engineCapacityCc?: number;
  powerBhp?: number;
  torqueNm?: number;
  seatingCapacity?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreatePriceBookInput {
  code: string;
  name: string;
  showroomId?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
}

export interface UpsertPriceEntryInput {
  variantId: string;
  exShowroomPaise: number;
  components: Array<{
    code: string;
    label: string;
    category: PriceComponentCategory;
    calculation: PriceCalculation;
    amountPaise?: number;
    rateBasisPoints?: number;
    isOptional?: boolean;
    sortOrder?: number;
  }>;
}

export interface CreateUsedVehicleInput {
  showroomId: string;
  modelId?: string | null;
  variantId?: string | null;
  make: string;
  modelName: string;
  variantName: string;
  registrationYear: number;
  registrationMonth?: number | null;
  mileageKm: number;
  fuelType: FuelType;
  transmission: Transmission;
  ownershipCount?: number;
  colourName: string;
  pricePaise: number;
  stockStatus?: StockStatus;
  certified?: boolean;
  registrationNumberMasked: string;
  description: string;
  highlights?: string[];
  slug?: string;
}

export interface UpdateUsedVehicleInput {
  pricePaise?: number;
  stockStatus?: StockStatus;
  showroomId?: string;
  mileageKm?: number;
  description?: string;
  highlights?: string[];
}

export class CmsService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  // ---------------------------------------------------------------------------
  // Vehicle Models
  // ---------------------------------------------------------------------------

  async listModels() {
    return this.prisma.vehicleModel.findMany({
      include: {
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
        colours: true,
        images: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getModelById(id: string) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            specifications: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        colours: true,
        images: true,
      },
    });

    if (!model) {
      throw new AppError(404, 'NOT_FOUND', `Vehicle model '${id}' not found`);
    }

    return model;
  }

  async createModel(input: CreateModelInput) {
    const existing = await this.prisma.vehicleModel.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE_SLUG', `Model with slug '${input.slug}' already exists`);
    }

    return this.prisma.vehicleModel.create({
      data: {
        make: input.make,
        name: input.name,
        slug: input.slug,
        bodyType: input.bodyType,
        summary: input.summary,
        description: input.description,
        isActive: true,
      },
    });
  }

  async updateModel(id: string, input: UpdateModelInput) {
    await this.getModelById(id);

    return this.prisma.vehicleModel.update({
      where: { id },
      data: input,
    });
  }

  async deactivateModel(id: string) {
    await this.getModelById(id);

    return this.prisma.vehicleModel.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Vehicle Variants
  // ---------------------------------------------------------------------------

  async createVariant(input: CreateVariantInput) {
    await this.getModelById(input.modelId);

    const existingSlug = await this.prisma.vehicleVariant.findUnique({
      where: { slug: input.slug },
    });
    if (existingSlug) {
      throw new AppError(409, 'DUPLICATE_SLUG', `Variant with slug '${input.slug}' already exists`);
    }

    return this.prisma.vehicleVariant.create({
      data: {
        modelId: input.modelId,
        name: input.name,
        slug: input.slug,
        fuelType: input.fuelType,
        transmission: input.transmission,
        engineCapacityCc: input.engineCapacityCc,
        powerBhp: input.powerBhp,
        torqueNm: input.torqueNm,
        seatingCapacity: input.seatingCapacity ?? 5,
        sortOrder: input.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  async updateVariant(id: string, input: UpdateVariantInput) {
    const variant = await this.prisma.vehicleVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new AppError(404, 'NOT_FOUND', `Variant '${id}' not found`);
    }

    return this.prisma.vehicleVariant.update({
      where: { id },
      data: input,
    });
  }

  async deactivateVariant(id: string) {
    const variant = await this.prisma.vehicleVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new AppError(404, 'NOT_FOUND', `Variant '${id}' not found`);
    }

    return this.prisma.vehicleVariant.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ---------------------------------------------------------------------------
  // Inventory Stock Units
  // ---------------------------------------------------------------------------

  async listInventory(params?: { showroomId?: string; status?: StockStatus }) {
    const where: Record<string, unknown> = {};
    if (params?.showroomId) where.showroomId = params.showroomId;
    if (params?.status) where.status = params.status;

    return this.prisma.newVehicleInventory.findMany({
      where,
      include: {
        showroom: true,
        variant: {
          include: {
            model: true,
          },
        },
        colour: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInventoryUnit(input: {
    showroomId: string;
    variantId: string;
    colourId?: string;
    stockNumber: string;
    manufactureYear?: number;
    odometerKm?: number;
    status?: StockStatus;
  }) {
    const existing = await this.prisma.newVehicleInventory.findUnique({
      where: { stockNumber: input.stockNumber },
    });
    if (existing) {
      throw new AppError(
        409,
        'DUPLICATE_STOCK_NUMBER',
        `Vehicle with stock number '${input.stockNumber}' already exists`,
      );
    }

    return this.prisma.newVehicleInventory.create({
      data: {
        showroomId: input.showroomId,
        variantId: input.variantId,
        colourId: input.colourId || null,
        stockNumber: input.stockNumber,
        manufactureYear: input.manufactureYear ?? 2026,
        odometerKm: input.odometerKm ?? 0,
        status: input.status ?? StockStatus.AVAILABLE,
      },
      include: {
        showroom: true,
        variant: {
          include: { model: true },
        },
        colour: true,
      },
    });
  }

  async updateInventoryUnit(
    id: string,
    input: {
      status?: StockStatus;
      showroomId?: string;
    },
  ) {
    const unit = await this.prisma.newVehicleInventory.findUnique({ where: { id } });
    if (!unit) {
      throw new AppError(404, 'NOT_FOUND', `Inventory unit '${id}' not found`);
    }

    return this.prisma.newVehicleInventory.update({
      where: { id },
      data: input,
      include: {
        showroom: true,
        variant: {
          include: { model: true },
        },
        colour: true,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Price Books & On-Road Components
  // ---------------------------------------------------------------------------

  async listPriceBooks() {
    return this.prisma.priceBook.findMany({
      include: {
        showroom: true,
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getPriceBookById(id: string) {
    const book = await this.prisma.priceBook.findUnique({
      where: { id },
      include: {
        showroom: true,
        entries: {
          include: {
            variant: {
              include: { model: true },
            },
            components: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!book) {
      throw new AppError(404, 'NOT_FOUND', `Price book '${id}' not found`);
    }

    return book;
  }

  async createPriceBook(input: CreatePriceBookInput) {
    const existing = await this.prisma.priceBook.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new AppError(
        409,
        'DUPLICATE_CODE',
        `Price book with code '${input.code}' already exists`,
      );
    }

    return this.prisma.priceBook.create({
      data: {
        code: input.code,
        name: input.name,
        showroomId: input.showroomId || null,
        status: PriceBookStatus.DRAFT,
        isSample: false,
        effectiveFrom: new Date(input.effectiveFrom),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        notes: input.notes,
      },
      include: { showroom: true },
    });
  }

  async upsertPriceEntry(bookId: string, input: UpsertPriceEntryInput) {
    const book = await this.getPriceBookById(bookId);
    if (book.status === PriceBookStatus.ARCHIVED) {
      throw new AppError(400, 'INVALID_STATE', 'Cannot modify an archived price book');
    }

    return this.prisma.$transaction(async (tx) => {
      // Find or create entry
      const existingEntry = await tx.priceEntry.findUnique({
        where: {
          priceBookId_variantId: {
            priceBookId: bookId,
            variantId: input.variantId,
          },
        },
      });

      let entryId: string;
      if (existingEntry) {
        const updated = await tx.priceEntry.update({
          where: { id: existingEntry.id },
          data: {
            exShowroomPaise: input.exShowroomPaise,
            priceKind: PriceKind.PUBLISHED,
          },
        });
        entryId = updated.id;
        // Delete existing components to replace with new set
        await tx.priceComponent.deleteMany({ where: { priceEntryId: entryId } });
      } else {
        const created = await tx.priceEntry.create({
          data: {
            priceBookId: bookId,
            variantId: input.variantId,
            exShowroomPaise: input.exShowroomPaise,
            priceKind: PriceKind.PUBLISHED,
          },
        });
        entryId = created.id;
      }

      // Insert components
      if (input.components && input.components.length > 0) {
        for (let i = 0; i < input.components.length; i++) {
          const comp = input.components[i]!;
          await tx.priceComponent.create({
            data: {
              priceEntryId: entryId,
              code: comp.code,
              label: comp.label,
              category: comp.category,
              calculation: comp.calculation,
              amountPaise: comp.amountPaise ?? null,
              rateBasisPoints: comp.rateBasisPoints ?? null,
              isOptional: comp.isOptional ?? false,
              sortOrder: comp.sortOrder ?? i + 1,
            },
          });
        }
      }

      return tx.priceEntry.findUnique({
        where: { id: entryId },
        include: {
          variant: { include: { model: true } },
          components: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  async publishPriceBook(id: string) {
    const book = await this.getPriceBookById(id);
    if (book.status === PriceBookStatus.PUBLISHED) {
      return book;
    }

    // Check for overlapping published price books for the same showroom
    const effectiveTo = book.effectiveTo ?? new Date('2099-12-31T23:59:59Z');

    const overlapping = await this.prisma.priceBook.findFirst({
      where: {
        id: { not: id },
        showroomId: book.showroomId,
        status: PriceBookStatus.PUBLISHED,
        AND: [
          { effectiveFrom: { lte: effectiveTo } },
          {
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: book.effectiveFrom } }],
          },
        ],
      },
    });

    if (overlapping) {
      throw new AppError(
        409,
        'DATE_OVERLAP',
        `Cannot publish: overlaps with already published price book '${overlapping.name}' (${overlapping.code}) for this showroom`,
      );
    }

    return this.prisma.priceBook.update({
      where: { id },
      data: {
        status: PriceBookStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: { showroom: true },
    });
  }

  async archivePriceBook(id: string) {
    await this.getPriceBookById(id);

    return this.prisma.priceBook.update({
      where: { id },
      data: {
        status: PriceBookStatus.ARCHIVED,
      },
      include: { showroom: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Model Colours & Variant Specifications
  // ---------------------------------------------------------------------------

  async createModelColour(
    modelId: string,
    input: {
      name: string;
      hexCode: string;
      finish?: string;
      sortOrder?: number;
    },
  ) {
    await this.getModelById(modelId);

    return this.prisma.vehicleColour.create({
      data: {
        modelId,
        name: input.name,
        hexCode: input.hexCode,
        finish: input.finish ?? 'METALLIC',
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async deleteModelColour(id: string) {
    return this.prisma.vehicleColour.delete({ where: { id } });
  }

  async upsertVariantSpecification(
    variantId: string,
    input: {
      group: SpecificationGroup;
      label: string;
      value: string;
      sortOrder?: number;
    },
  ) {
    const variant = await this.prisma.vehicleVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new AppError(404, 'NOT_FOUND', `Variant '${variantId}' not found`);
    }

    return this.prisma.vehicleSpecification.upsert({
      where: {
        variantId_group_label: {
          variantId,
          group: input.group,
          label: input.label,
        },
      },
      update: {
        value: input.value,
        sortOrder: input.sortOrder ?? 0,
      },
      create: {
        variantId,
        group: input.group,
        label: input.label,
        value: input.value,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Certified Pre-Owned / Used Vehicles
  // ---------------------------------------------------------------------------

  async listUsedVehicles(params?: { showroomId?: string; stockStatus?: StockStatus }) {
    const where: Record<string, unknown> = {};
    if (params?.showroomId) where.showroomId = params.showroomId;
    if (params?.stockStatus) where.stockStatus = params.stockStatus;

    return this.prisma.usedVehicle.findMany({
      where,
      include: {
        showroom: true,
        model: true,
        variant: true,
        inspections: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUsedVehicleById(id: string) {
    const vehicle = await this.prisma.usedVehicle.findUnique({
      where: { id },
      include: {
        showroom: true,
        model: true,
        variant: true,
        inspections: {
          include: { items: true },
        },
      },
    });
    if (!vehicle) {
      throw new AppError(404, 'NOT_FOUND', `Used vehicle '${id}' not found`);
    }
    return vehicle;
  }

  async createUsedVehicle(input: CreateUsedVehicleInput) {
    const baseSlug = (
      input.slug ?? `${input.modelName}-${input.variantName}-${input.registrationYear}`
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let count = 1;
    while (await this.prisma.usedVehicle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    return this.prisma.usedVehicle.create({
      data: {
        slug,
        showroomId: input.showroomId,
        modelId: input.modelId || null,
        variantId: input.variantId || null,
        make: input.make,
        modelName: input.modelName,
        variantName: input.variantName,
        registrationYear: input.registrationYear,
        registrationMonth: input.registrationMonth || null,
        mileageKm: input.mileageKm,
        fuelType: input.fuelType,
        transmission: input.transmission,
        ownershipCount: input.ownershipCount ?? 1,
        colourName: input.colourName,
        pricePaise: input.pricePaise,
        priceKind: PriceKind.PUBLISHED,
        stockStatus: input.stockStatus ?? StockStatus.AVAILABLE,
        certified: input.certified ?? true,
        registrationNumberMasked: input.registrationNumberMasked,
        description: input.description,
        highlights: input.highlights ?? [],
      },
      include: {
        showroom: true,
        model: true,
        variant: true,
      },
    });
  }

  async updateUsedVehicle(id: string, input: UpdateUsedVehicleInput) {
    await this.getUsedVehicleById(id);

    return this.prisma.usedVehicle.update({
      where: { id },
      data: {
        pricePaise: input.pricePaise,
        stockStatus: input.stockStatus,
        showroomId: input.showroomId,
        mileageKm: input.mileageKm,
        description: input.description,
        highlights: input.highlights,
      },
      include: {
        showroom: true,
        model: true,
        variant: true,
      },
    });
  }
}
