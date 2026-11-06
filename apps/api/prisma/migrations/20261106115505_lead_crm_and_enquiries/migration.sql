-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEB_ENQUIRY', 'TEST_DRIVE_REQUEST', 'SERVICE_REQUEST', 'PORTAL_IMPORT', 'PHONE_INQUIRY', 'WALK_IN');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'TEST_DRIVE_SCHEDULED', 'NEGOTIATING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "PreferredContactMethod" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('NEW_CAR', 'USED_CAR', 'SERVICE', 'GENERAL');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "leadReference" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "LeadType" NOT NULL DEFAULT 'NEW_CAR',
    "modelId" TEXT,
    "variantId" TEXT,
    "usedVehicleId" TEXT,
    "showroomId" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'WEB_ENQUIRY',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedStaffId" TEXT,
    "preferredContactMethod" "PreferredContactMethod" NOT NULL DEFAULT 'PHONE',
    "customerRequirements" TEXT,
    "externalLeadId" TEXT,
    "importBatchId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "staffUserId" TEXT,
    "activityType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_notes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status_history" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus" NOT NULL,
    "changedByStaffId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_import_batches" (
    "id" TEXT NOT NULL,
    "batchReference" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'PORTAL_IMPORT',
    "uploadedByStaffId" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errorSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_leadReference_key" ON "leads"("leadReference");

-- CreateIndex
CREATE INDEX "leads_showroomId_status_idx" ON "leads"("showroomId", "status");

-- CreateIndex
CREATE INDEX "leads_assignedStaffId_status_idx" ON "leads"("assignedStaffId", "status");

-- CreateIndex
CREATE INDEX "leads_status_createdAt_idx" ON "leads"("status", "createdAt");

-- CreateIndex
CREATE INDEX "leads_customerId_idx" ON "leads"("customerId");

-- CreateIndex
CREATE INDEX "leads_externalLeadId_idx" ON "leads"("externalLeadId");

-- CreateIndex
CREATE INDEX "leads_importBatchId_idx" ON "leads"("importBatchId");

-- CreateIndex
CREATE INDEX "leads_type_status_idx" ON "leads"("type", "status");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_createdAt_idx" ON "lead_activities"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_activities_staffUserId_idx" ON "lead_activities"("staffUserId");

-- CreateIndex
CREATE INDEX "lead_notes_leadId_createdAt_idx" ON "lead_notes"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_notes_staffUserId_idx" ON "lead_notes"("staffUserId");

-- CreateIndex
CREATE INDEX "lead_status_history_leadId_createdAt_idx" ON "lead_status_history"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_status_history_toStatus_idx" ON "lead_status_history"("toStatus");

-- CreateIndex
CREATE UNIQUE INDEX "lead_import_batches_batchReference_key" ON "lead_import_batches"("batchReference");

-- CreateIndex
CREATE INDEX "lead_import_batches_uploadedByStaffId_idx" ON "lead_import_batches"("uploadedByStaffId");

-- CreateIndex
CREATE INDEX "lead_import_batches_createdAt_idx" ON "lead_import_batches"("createdAt");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "vehicle_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_usedVehicleId_fkey" FOREIGN KEY ("usedVehicleId") REFERENCES "used_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "lead_import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_changedByStaffId_fkey" FOREIGN KEY ("changedByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_import_batches" ADD CONSTRAINT "lead_import_batches_uploadedByStaffId_fkey" FOREIGN KEY ("uploadedByStaffId") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
