-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'SALES_CONSULTANT', 'USED_CAR_STAFF', 'SERVICE_ADVISOR');

-- CreateTable
CREATE TABLE "staff_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "StaffRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_location_assignments" (
    "id" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "showroomId" TEXT,
    "workshopId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_location_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authentication_audit_events" (
    "id" TEXT NOT NULL,
    "staffUserId" TEXT,
    "email" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authentication_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");

-- CreateIndex
CREATE INDEX "staff_users_email_isActive_idx" ON "staff_users"("email", "isActive");

-- CreateIndex
CREATE INDEX "staff_users_role_isActive_idx" ON "staff_users"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "staff_sessions_tokenHash_key" ON "staff_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "staff_sessions_staffUserId_revokedAt_idx" ON "staff_sessions"("staffUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "staff_sessions_expiresAt_idx" ON "staff_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "staff_location_assignments_staffUserId_idx" ON "staff_location_assignments"("staffUserId");

-- CreateIndex
CREATE INDEX "staff_location_assignments_showroomId_idx" ON "staff_location_assignments"("showroomId");

-- CreateIndex
CREATE INDEX "staff_location_assignments_workshopId_idx" ON "staff_location_assignments"("workshopId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_location_assignments_staffUserId_showroomId_key" ON "staff_location_assignments"("staffUserId", "showroomId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_location_assignments_staffUserId_workshopId_key" ON "staff_location_assignments"("staffUserId", "workshopId");

-- CreateIndex
CREATE INDEX "authentication_audit_events_staffUserId_createdAt_idx" ON "authentication_audit_events"("staffUserId", "createdAt");

-- CreateIndex
CREATE INDEX "authentication_audit_events_email_createdAt_idx" ON "authentication_audit_events"("email", "createdAt");

-- CreateIndex
CREATE INDEX "authentication_audit_events_eventType_createdAt_idx" ON "authentication_audit_events"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_location_assignments" ADD CONSTRAINT "staff_location_assignments_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_location_assignments" ADD CONSTRAINT "staff_location_assignments_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_location_assignments" ADD CONSTRAINT "staff_location_assignments_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication_audit_events" ADD CONSTRAINT "authentication_audit_events_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
