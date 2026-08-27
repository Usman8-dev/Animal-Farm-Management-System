-- CreateEnum
CREATE TYPE "PregnancyOutcome" AS ENUM ('LIVE_BIRTH', 'STILLBIRTH', 'ABORTED', 'NOT_PREGNANT');

-- CreateTable
CREATE TABLE "pregnancies" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "dam_id" INTEGER NOT NULL,
    "sire_id" INTEGER,
    "sire_ref" TEXT,
    "service_date" TIMESTAMP(3) NOT NULL,
    "expected_delivery_date" TIMESTAMP(3) NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_date" TIMESTAMP(3),
    "outcome" "PregnancyOutcome",
    "outcome_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "pregnancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "births" (
    "id" SERIAL NOT NULL,
    "pregnancy_id" INTEGER NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "births_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birth_kids" (
    "id" SERIAL NOT NULL,
    "birth_id" INTEGER NOT NULL,
    "animal_id" INTEGER,
    "is_stillborn" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "birth_weight_kg" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "birth_kids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pregnancies_farm_id_expected_delivery_date_idx" ON "pregnancies"("farm_id", "expected_delivery_date");

-- CreateIndex
CREATE INDEX "pregnancies_dam_id_service_date_idx" ON "pregnancies"("dam_id", "service_date");

-- CreateIndex
CREATE INDEX "birth_kids_birth_id_idx" ON "birth_kids"("birth_id");

-- CreateIndex
CREATE UNIQUE INDEX "birth_kids_animal_id_key" ON "birth_kids"("animal_id");

-- AddForeignKey
ALTER TABLE "pregnancies" ADD CONSTRAINT "pregnancies_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancies" ADD CONSTRAINT "pregnancies_dam_id_fkey" FOREIGN KEY ("dam_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancies" ADD CONSTRAINT "pregnancies_sire_id_fkey" FOREIGN KEY ("sire_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "births" ADD CONSTRAINT "births_pregnancy_id_fkey" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_kids" ADD CONSTRAINT "birth_kids_birth_id_fkey" FOREIGN KEY ("birth_id") REFERENCES "births"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_kids" ADD CONSTRAINT "birth_kids_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;