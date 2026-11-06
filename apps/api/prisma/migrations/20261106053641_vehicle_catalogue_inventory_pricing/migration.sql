-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('HATCHBACK', 'SEDAN', 'SUV', 'CROSSOVER');

-- CreateEnum
CREATE TYPE "SpecificationGroup" AS ENUM ('ENGINE', 'PERFORMANCE', 'DIMENSIONS', 'SAFETY', 'COMFORT', 'TECHNOLOGY');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'IN_TRANSIT');

-- CreateEnum
CREATE TYPE "PriceBookStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PriceKind" AS ENUM ('SAMPLE_ESTIMATE', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PriceComponentCategory" AS ENUM ('ROAD_TAX', 'INSURANCE', 'REGISTRATION', 'ACCESSORIES', 'OTHER');

-- CreateEnum
CREATE TYPE "PriceCalculation" AS ENUM ('FIXED', 'PERCENT_OF_EXSHOWROOM');

-- CreateEnum
CREATE TYPE "InspectionRating" AS ENUM ('PASS', 'ATTENTION', 'FAIL');

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyType" "BodyType" NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_variants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "engineCapacityCc" INTEGER,
    "powerBhp" INTEGER,
    "torqueNm" INTEGER,
    "seatingCapacity" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_colours" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hexCode" TEXT NOT NULL,
    "finish" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_colours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "caption" TEXT,
    "credit" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_specifications" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "group" "SpecificationGroup" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vehicle_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "new_vehicle_inventory" (
    "id" TEXT NOT NULL,
    "stockNumber" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "colourId" TEXT,
    "status" "StockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "manufactureYear" INTEGER NOT NULL,
    "odometerKm" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "new_vehicle_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_books" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "showroomId" TEXT,
    "status" "PriceBookStatus" NOT NULL DEFAULT 'DRAFT',
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_entries" (
    "id" TEXT NOT NULL,
    "priceBookId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "exShowroomPaise" INTEGER NOT NULL,
    "priceKind" "PriceKind" NOT NULL DEFAULT 'SAMPLE_ESTIMATE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_components" (
    "id" TEXT NOT NULL,
    "priceEntryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "PriceComponentCategory" NOT NULL,
    "calculation" "PriceCalculation" NOT NULL,
    "amountPaise" INTEGER,
    "rateBasisPoints" INTEGER,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "price_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_vehicles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "modelId" TEXT,
    "variantId" TEXT,
    "showroomId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "registrationYear" INTEGER NOT NULL,
    "registrationMonth" INTEGER,
    "mileageKm" INTEGER NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "ownershipCount" INTEGER NOT NULL DEFAULT 1,
    "colourName" TEXT NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "priceKind" "PriceKind" NOT NULL DEFAULT 'SAMPLE_ESTIMATE',
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "certified" BOOLEAN NOT NULL DEFAULT true,
    "registrationNumberMasked" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "used_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_vehicle_inspections" (
    "id" TEXT NOT NULL,
    "usedVehicleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "inspectedAt" TIMESTAMP(3) NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "reportReference" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "used_vehicle_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_inspection_items" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rating" "InspectionRating" NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "used_inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_slug_key" ON "vehicle_models"("slug");

-- CreateIndex
CREATE INDEX "vehicle_models_make_isActive_idx" ON "vehicle_models"("make", "isActive");

-- CreateIndex
CREATE INDEX "vehicle_models_bodyType_isActive_idx" ON "vehicle_models"("bodyType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_variants_slug_key" ON "vehicle_variants"("slug");

-- CreateIndex
CREATE INDEX "vehicle_variants_modelId_isActive_sortOrder_idx" ON "vehicle_variants"("modelId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "vehicle_variants_fuelType_isActive_idx" ON "vehicle_variants"("fuelType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_variants_modelId_name_key" ON "vehicle_variants"("modelId", "name");

-- CreateIndex
CREATE INDEX "vehicle_colours_modelId_isActive_sortOrder_idx" ON "vehicle_colours"("modelId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_colours_modelId_name_key" ON "vehicle_colours"("modelId", "name");

-- CreateIndex
CREATE INDEX "vehicle_images_modelId_isPrimary_idx" ON "vehicle_images"("modelId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_images_modelId_sortOrder_key" ON "vehicle_images"("modelId", "sortOrder");

-- CreateIndex
CREATE INDEX "vehicle_specifications_variantId_group_sortOrder_idx" ON "vehicle_specifications"("variantId", "group", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_specifications_variantId_group_label_key" ON "vehicle_specifications"("variantId", "group", "label");

-- CreateIndex
CREATE UNIQUE INDEX "new_vehicle_inventory_stockNumber_key" ON "new_vehicle_inventory"("stockNumber");

-- CreateIndex
CREATE INDEX "new_vehicle_inventory_showroomId_status_idx" ON "new_vehicle_inventory"("showroomId", "status");

-- CreateIndex
CREATE INDEX "new_vehicle_inventory_variantId_status_idx" ON "new_vehicle_inventory"("variantId", "status");

-- CreateIndex
CREATE INDEX "new_vehicle_inventory_colourId_idx" ON "new_vehicle_inventory"("colourId");

-- CreateIndex
CREATE UNIQUE INDEX "price_books_code_key" ON "price_books"("code");

-- CreateIndex
CREATE INDEX "price_books_showroomId_status_effectiveFrom_idx" ON "price_books"("showroomId", "status", "effectiveFrom");

-- CreateIndex
CREATE INDEX "price_books_status_effectiveFrom_idx" ON "price_books"("status", "effectiveFrom");

-- CreateIndex
CREATE INDEX "price_entries_variantId_idx" ON "price_entries"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "price_entries_priceBookId_variantId_key" ON "price_entries"("priceBookId", "variantId");

-- CreateIndex
CREATE INDEX "price_components_priceEntryId_sortOrder_idx" ON "price_components"("priceEntryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "price_components_priceEntryId_code_key" ON "price_components"("priceEntryId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "used_vehicles_slug_key" ON "used_vehicles"("slug");

-- CreateIndex
CREATE INDEX "used_vehicles_showroomId_stockStatus_idx" ON "used_vehicles"("showroomId", "stockStatus");

-- CreateIndex
CREATE INDEX "used_vehicles_registrationYear_mileageKm_idx" ON "used_vehicles"("registrationYear", "mileageKm");

-- CreateIndex
CREATE INDEX "used_vehicles_fuelType_transmission_idx" ON "used_vehicles"("fuelType", "transmission");

-- CreateIndex
CREATE INDEX "used_vehicles_pricePaise_idx" ON "used_vehicles"("pricePaise");

-- CreateIndex
CREATE INDEX "used_vehicles_modelId_idx" ON "used_vehicles"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "used_vehicle_inspections_reportReference_key" ON "used_vehicle_inspections"("reportReference");

-- CreateIndex
CREATE INDEX "used_vehicle_inspections_usedVehicleId_isCurrent_idx" ON "used_vehicle_inspections"("usedVehicleId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "used_vehicle_inspections_usedVehicleId_version_key" ON "used_vehicle_inspections"("usedVehicleId", "version");

-- CreateIndex
CREATE INDEX "used_inspection_items_inspectionId_sortOrder_idx" ON "used_inspection_items"("inspectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "used_inspection_items_inspectionId_label_key" ON "used_inspection_items"("inspectionId", "label");

-- AddForeignKey
ALTER TABLE "vehicle_variants" ADD CONSTRAINT "vehicle_variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_colours" ADD CONSTRAINT "vehicle_colours_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_specifications" ADD CONSTRAINT "vehicle_specifications_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "vehicle_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_vehicle_inventory" ADD CONSTRAINT "new_vehicle_inventory_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_vehicle_inventory" ADD CONSTRAINT "new_vehicle_inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "vehicle_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "new_vehicle_inventory" ADD CONSTRAINT "new_vehicle_inventory_colourId_fkey" FOREIGN KEY ("colourId") REFERENCES "vehicle_colours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_priceBookId_fkey" FOREIGN KEY ("priceBookId") REFERENCES "price_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "vehicle_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_components" ADD CONSTRAINT "price_components_priceEntryId_fkey" FOREIGN KEY ("priceEntryId") REFERENCES "price_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_vehicles" ADD CONSTRAINT "used_vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_vehicles" ADD CONSTRAINT "used_vehicles_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "vehicle_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_vehicles" ADD CONSTRAINT "used_vehicles_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_vehicle_inspections" ADD CONSTRAINT "used_vehicle_inspections_usedVehicleId_fkey" FOREIGN KEY ("usedVehicleId") REFERENCES "used_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_inspection_items" ADD CONSTRAINT "used_inspection_items_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "used_vehicle_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
