-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TradeInStatus" AS ENUM ('SUBMITTED', 'EVALUATING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRICE_APPROVAL', 'PRICE_REJECTION', 'PRICE_PROPOSAL_SUBMITTED', 'TRADE_IN_ASSIGNED', 'NEW_LEAD', 'SYSTEM');

-- AlterTable
ALTER TABLE "customer_consents" ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'EXPLICIT_DIRECT';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "consentStatus" TEXT NOT NULL DEFAULT 'EXPLICIT_DIRECT';

-- CreateTable
CREATE TABLE "used_car_price_proposals" (
    "id" TEXT NOT NULL,
    "usedVehicleId" TEXT NOT NULL,
    "currentPricePaise" INTEGER NOT NULL,
    "proposedPricePaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "proposedByStaffId" TEXT NOT NULL,
    "reviewedByStaffId" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "used_car_price_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badgeText" TEXT,
    "imageUrl" TEXT,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "modelId" TEXT,
    "showroomId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotion_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_banners" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "subheadline" TEXT,
    "badgeText" TEXT,
    "imageUrl" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "ctaUrl" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_in_requests" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "registrationYear" INTEGER NOT NULL,
    "mileageKm" INTEGER NOT NULL,
    "ownershipCount" INTEGER NOT NULL DEFAULT 1,
    "condition" "VehicleCondition" NOT NULL DEFAULT 'GOOD',
    "fuelType" TEXT,
    "transmission" TEXT,
    "estimatedValuationMinPaise" INTEGER NOT NULL,
    "estimatedValuationMaxPaise" INTEGER NOT NULL,
    "offeredValuationPaise" INTEGER,
    "status" "TradeInStatus" NOT NULL DEFAULT 'SUBMITTED',
    "customerNotes" TEXT,
    "staffNotes" TEXT,
    "assignedStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_in_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_notifications" (
    "id" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "staff_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "used_car_price_proposals_usedVehicleId_status_idx" ON "used_car_price_proposals"("usedVehicleId", "status");

-- CreateIndex
CREATE INDEX "used_car_price_proposals_status_createdAt_idx" ON "used_car_price_proposals"("status", "createdAt");

-- CreateIndex
CREATE INDEX "used_car_price_proposals_proposedByStaffId_idx" ON "used_car_price_proposals"("proposedByStaffId");

-- CreateIndex
CREATE INDEX "used_car_price_proposals_reviewedByStaffId_idx" ON "used_car_price_proposals"("reviewedByStaffId");

-- CreateIndex
CREATE INDEX "promotion_offers_isPublished_startDate_endDate_idx" ON "promotion_offers"("isPublished", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "promotion_offers_modelId_idx" ON "promotion_offers"("modelId");

-- CreateIndex
CREATE INDEX "promotion_offers_showroomId_idx" ON "promotion_offers"("showroomId");

-- CreateIndex
CREATE INDEX "homepage_banners_isPublished_displayOrder_idx" ON "homepage_banners"("isPublished", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "trade_in_requests_reference_key" ON "trade_in_requests"("reference");

-- CreateIndex
CREATE INDEX "trade_in_requests_showroomId_status_idx" ON "trade_in_requests"("showroomId", "status");

-- CreateIndex
CREATE INDEX "trade_in_requests_assignedStaffId_status_idx" ON "trade_in_requests"("assignedStaffId", "status");

-- CreateIndex
CREATE INDEX "trade_in_requests_customerId_idx" ON "trade_in_requests"("customerId");

-- CreateIndex
CREATE INDEX "trade_in_requests_reference_idx" ON "trade_in_requests"("reference");

-- CreateIndex
CREATE INDEX "staff_notifications_staffUserId_isRead_createdAt_idx" ON "staff_notifications"("staffUserId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "used_car_price_proposals" ADD CONSTRAINT "used_car_price_proposals_usedVehicleId_fkey" FOREIGN KEY ("usedVehicleId") REFERENCES "used_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_car_price_proposals" ADD CONSTRAINT "used_car_price_proposals_proposedByStaffId_fkey" FOREIGN KEY ("proposedByStaffId") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_car_price_proposals" ADD CONSTRAINT "used_car_price_proposals_reviewedByStaffId_fkey" FOREIGN KEY ("reviewedByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_offers" ADD CONSTRAINT "promotion_offers_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_offers" ADD CONSTRAINT "promotion_offers_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_in_requests" ADD CONSTRAINT "trade_in_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_in_requests" ADD CONSTRAINT "trade_in_requests_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_in_requests" ADD CONSTRAINT "trade_in_requests_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_notifications" ADD CONSTRAINT "staff_notifications_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
