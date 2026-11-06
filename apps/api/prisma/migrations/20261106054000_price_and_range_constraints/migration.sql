-- Database-level guards for money and range values. Prisma does not model
-- CHECK constraints, so they are added deliberately in a follow-up migration.

ALTER TABLE "price_entries"
  ADD CONSTRAINT "price_entries_exShowroomPaise_positive" CHECK ("exShowroomPaise" > 0);

ALTER TABLE "price_components"
  ADD CONSTRAINT "price_components_calculation_values" CHECK (
    ("calculation" = 'FIXED' AND "amountPaise" IS NOT NULL AND "amountPaise" >= 0)
    OR
    ("calculation" = 'PERCENT_OF_EXSHOWROOM' AND "rateBasisPoints" IS NOT NULL AND "rateBasisPoints" >= 0 AND "rateBasisPoints" <= 10000)
  );

ALTER TABLE "used_vehicles"
  ADD CONSTRAINT "used_vehicles_values" CHECK (
    "pricePaise" > 0
    AND "mileageKm" >= 0
    AND "registrationYear" BETWEEN 1980 AND 2100
    AND ("registrationMonth" IS NULL OR "registrationMonth" BETWEEN 1 AND 12)
    AND "ownershipCount" >= 1
  );

ALTER TABLE "new_vehicle_inventory"
  ADD CONSTRAINT "new_vehicle_inventory_values" CHECK (
    "manufactureYear" BETWEEN 1980 AND 2100
    AND "odometerKm" >= 0
  );

ALTER TABLE "used_vehicle_inspections"
  ADD CONSTRAINT "used_vehicle_inspections_score" CHECK ("overallScore" BETWEEN 0 AND 100);
