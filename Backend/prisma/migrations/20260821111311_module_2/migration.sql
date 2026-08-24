-- CreateEnum
CREATE TYPE "StatusCategory" AS ENUM ('PRESENCE', 'REPRODUCTIVE', 'HEALTH');

-- DropIndex
DROP INDEX "animal_types_farm_id_idx";

-- DropIndex
DROP INDEX "breeds_farm_id_idx";

-- DropIndex
DROP INDEX "genders_farm_id_idx";

-- CreateTable
CREATE TABLE "animal_statuses" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "StatusCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "animal_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" SERIAL NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "animal_statuses_farm_id_code_key" ON "animal_statuses"("farm_id", "code");

-- AddForeignKey
ALTER TABLE "animal_statuses" ADD CONSTRAINT "animal_statuses_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "animal_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
