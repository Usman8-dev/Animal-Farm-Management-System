/*
  Warnings:

  - A unique constraint covering the columns `[pregnancy_id]` on the table `births` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "pregnancies" DROP CONSTRAINT "pregnancies_sire_id_fkey";

-- DropIndex
DROP INDEX "birth_kids_birth_id_idx";

-- AlterTable
ALTER TABLE "animals" ADD COLUMN     "breeder" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "vaccination_types" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "vaccination_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccination_schedule_rules" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "vaccination_type_id" INTEGER NOT NULL,
    "animal_type_id" INTEGER NOT NULL,
    "dose_number" INTEGER NOT NULL,
    "age_days" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "vaccination_schedule_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_vaccinations" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "vaccination_type_id" INTEGER NOT NULL,
    "administered_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dose_number" INTEGER,
    "batch_number" TEXT,
    "administered_by" TEXT,
    "cost" DECIMAL(12,2),
    "next_due_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "animal_vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vaccination_types_farm_id_code_key" ON "vaccination_types"("farm_id", "code");

-- CreateIndex
CREATE INDEX "vaccination_schedule_rules_animal_type_id_idx" ON "vaccination_schedule_rules"("animal_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "vaccination_schedule_rules_farm_id_vaccination_type_id_anim_key" ON "vaccination_schedule_rules"("farm_id", "vaccination_type_id", "animal_type_id", "dose_number");

-- CreateIndex
CREATE INDEX "animal_vaccinations_animal_id_administered_date_idx" ON "animal_vaccinations"("animal_id", "administered_date");

-- CreateIndex
CREATE INDEX "animal_vaccinations_vaccination_type_id_batch_number_idx" ON "animal_vaccinations"("vaccination_type_id", "batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "births_pregnancy_id_key" ON "births"("pregnancy_id");

-- AddForeignKey
ALTER TABLE "pregnancies" ADD CONSTRAINT "pregnancies_sire_id_fkey" FOREIGN KEY ("sire_id") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination_types" ADD CONSTRAINT "vaccination_types_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination_schedule_rules" ADD CONSTRAINT "vaccination_schedule_rules_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination_schedule_rules" ADD CONSTRAINT "vaccination_schedule_rules_vaccination_type_id_fkey" FOREIGN KEY ("vaccination_type_id") REFERENCES "vaccination_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination_schedule_rules" ADD CONSTRAINT "vaccination_schedule_rules_animal_type_id_fkey" FOREIGN KEY ("animal_type_id") REFERENCES "animal_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_vaccinations" ADD CONSTRAINT "animal_vaccinations_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_vaccinations" ADD CONSTRAINT "animal_vaccinations_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_vaccinations" ADD CONSTRAINT "animal_vaccinations_vaccination_type_id_fkey" FOREIGN KEY ("vaccination_type_id") REFERENCES "vaccination_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
