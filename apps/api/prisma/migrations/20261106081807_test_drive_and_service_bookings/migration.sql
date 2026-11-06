-- CreateEnum
CREATE TYPE "TestDriveStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_consents" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "noticeVersion" TEXT NOT NULL DEFAULT '2026.1',
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'WEBSITE',
    "ipHash" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_vehicles" (
    "id" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_drive_appointments" (
    "id" TEXT NOT NULL,
    "bookingReference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "demoVehicleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "TestDriveStatus" NOT NULL DEFAULT 'CONFIRMED',
    "driverLicenseNumber" TEXT,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "confirmationToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_drive_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshops" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Lucknow',
    "state" TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "phone" TEXT NOT NULL,
    "showroomId" TEXT,
    "baysCount" INTEGER NOT NULL DEFAULT 6,
    "dailyCapacity" INTEGER NOT NULL DEFAULT 24,
    "slotCapacity" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_operating_hours" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workshop_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "estimatedPricePaise" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_appointments" (
    "id" TEXT NOT NULL,
    "bookingReference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleRegistration" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehicleYear" INTEGER,
    "vehicleMileageKm" INTEGER,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "confirmationToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customer_consents_customerId_purpose_idx" ON "customer_consents"("customerId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "demo_vehicles_vin_key" ON "demo_vehicles"("vin");

-- CreateIndex
CREATE INDEX "demo_vehicles_showroomId_variantId_isActive_idx" ON "demo_vehicles"("showroomId", "variantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "demo_vehicles_showroomId_registrationNumber_key" ON "demo_vehicles"("showroomId", "registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "test_drive_appointments_bookingReference_key" ON "test_drive_appointments"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "test_drive_appointments_idempotencyKey_key" ON "test_drive_appointments"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "test_drive_appointments_confirmationToken_key" ON "test_drive_appointments"("confirmationToken");

-- CreateIndex
CREATE INDEX "test_drive_appointments_demoVehicleId_startTime_endTime_sta_idx" ON "test_drive_appointments"("demoVehicleId", "startTime", "endTime", "status");

-- CreateIndex
CREATE INDEX "test_drive_appointments_showroomId_startTime_idx" ON "test_drive_appointments"("showroomId", "startTime");

-- CreateIndex
CREATE INDEX "test_drive_appointments_customerId_idx" ON "test_drive_appointments"("customerId");

-- CreateIndex
CREATE INDEX "test_drive_appointments_bookingReference_idx" ON "test_drive_appointments"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "workshops_code_key" ON "workshops"("code");

-- CreateIndex
CREATE INDEX "workshops_city_isActive_idx" ON "workshops"("city", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "workshop_operating_hours_workshopId_dayOfWeek_key" ON "workshop_operating_hours"("workshopId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_code_key" ON "service_types"("code");

-- CreateIndex
CREATE INDEX "service_types_isActive_sortOrder_idx" ON "service_types"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "service_appointments_bookingReference_key" ON "service_appointments"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "service_appointments_idempotencyKey_key" ON "service_appointments"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "service_appointments_confirmationToken_key" ON "service_appointments"("confirmationToken");

-- CreateIndex
CREATE INDEX "service_appointments_workshopId_startTime_endTime_status_idx" ON "service_appointments"("workshopId", "startTime", "endTime", "status");

-- CreateIndex
CREATE INDEX "service_appointments_vehicleRegistration_idx" ON "service_appointments"("vehicleRegistration");

-- CreateIndex
CREATE INDEX "service_appointments_customerId_idx" ON "service_appointments"("customerId");

-- CreateIndex
CREATE INDEX "service_appointments_bookingReference_idx" ON "service_appointments"("bookingReference");

-- AddForeignKey
ALTER TABLE "customer_consents" ADD CONSTRAINT "customer_consents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_vehicles" ADD CONSTRAINT "demo_vehicles_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_vehicles" ADD CONSTRAINT "demo_vehicles_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "vehicle_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_appointments" ADD CONSTRAINT "test_drive_appointments_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_appointments" ADD CONSTRAINT "test_drive_appointments_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "vehicle_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_appointments" ADD CONSTRAINT "test_drive_appointments_demoVehicleId_fkey" FOREIGN KEY ("demoVehicleId") REFERENCES "demo_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_drive_appointments" ADD CONSTRAINT "test_drive_appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_operating_hours" ADD CONSTRAINT "workshop_operating_hours_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointments" ADD CONSTRAINT "service_appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
