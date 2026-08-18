-- Scope master/reference data (genders, animal_types, breeds) per farm.
-- Each registered user (owner) gets their own farm, so a new user must not
-- see reference data that belongs to other farms.

-- 1) Add farm_id columns (nullable first so existing rows can be backfilled)
ALTER TABLE "genders" ADD COLUMN "farm_id" INTEGER;
ALTER TABLE "animal_types" ADD COLUMN "farm_id" INTEGER;
ALTER TABLE "breeds" ADD COLUMN "farm_id" INTEGER;

-- 2) Backfill existing reference rows to the earliest farm so the existing
--    global reference data remains owned by one farm instead of leaking to all.
UPDATE "genders" SET "farm_id" = (SELECT MIN("id") FROM "farms");
UPDATE "animal_types" SET "farm_id" = (SELECT MIN("id") FROM "farms");
UPDATE "breeds" SET "farm_id" = (SELECT MIN("id") FROM "farms");

-- 3) Enforce NOT NULL
ALTER TABLE "genders" ALTER COLUMN "farm_id" SET NOT NULL;
ALTER TABLE "animal_types" ALTER COLUMN "farm_id" SET NOT NULL;
ALTER TABLE "breeds" ALTER COLUMN "farm_id" SET NOT NULL;

-- 4) Drop the old GLOBAL unique indexes (code was unique across ALL farms)
DROP INDEX "genders_code_key";
DROP INDEX "animal_types_code_key";
DROP INDEX "breeds_animal_type_id_code_key";

-- 5) Add PER-FARM unique constraints
CREATE UNIQUE INDEX "genders_farm_id_code_key" ON "genders"("farm_id", "code");
CREATE UNIQUE INDEX "animal_types_farm_id_code_key" ON "animal_types"("farm_id", "code");
CREATE UNIQUE INDEX "breeds_farm_id_animal_type_id_code_key" ON "breeds"("farm_id", "animal_type_id", "code");

-- 6) Add foreign keys back to farms
ALTER TABLE "genders" ADD CONSTRAINT "genders_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "animal_types" ADD CONSTRAINT "animal_types_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "breeds" ADD CONSTRAINT "breeds_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7) Indexes on farm_id for fast per-farm lookups
CREATE INDEX "genders_farm_id_idx" ON "genders"("farm_id");
CREATE INDEX "animal_types_farm_id_idx" ON "animal_types"("farm_id");
CREATE INDEX "breeds_farm_id_idx" ON "breeds"("farm_id");