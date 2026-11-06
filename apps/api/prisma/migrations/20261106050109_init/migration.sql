-- CreateTable
CREATE TABLE "showrooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Lucknow',
    "state" TEXT NOT NULL DEFAULT 'Uttar Pradesh',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showrooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "showrooms_code_key" ON "showrooms"("code");

-- CreateIndex
CREATE INDEX "showrooms_city_isActive_idx" ON "showrooms"("city", "isActive");
