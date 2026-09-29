-- CreateTable
CREATE TABLE "diseases" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "symptoms" TEXT,
    "description" TEXT,
    "is_contagious" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "withdrawal_days" INTEGER,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_cases" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "disease_id" INTEGER,
    "diagnosis" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "severity" TEXT NOT NULL DEFAULT 'MODERATE',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "diagnosed_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosed_by" TEXT,
    "is_contagious" BOOLEAN NOT NULL DEFAULT false,
    "is_quarantined" BOOLEAN NOT NULL DEFAULT false,
    "symptoms" TEXT,
    "notes" TEXT,
    "outcome_date" TIMESTAMP(3),
    "outcome_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "health_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_treatments" (
    "id" SERIAL NOT NULL,
    "farm_id" INTEGER NOT NULL,
    "case_id" INTEGER NOT NULL,
    "medicine_id" INTEGER,
    "medicine_name" TEXT,
    "dosage" TEXT,
    "route" TEXT,
    "frequency" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "administered_by" TEXT,
    "withdrawal_days" INTEGER,
    "withdrawal_end_date" TIMESTAMP(3),
    "cost" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "health_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "diseases_farm_id_code_key" ON "diseases"("farm_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_farm_id_code_key" ON "medicines"("farm_id", "code");

-- CreateIndex
CREATE INDEX "health_cases_farm_id_diagnosed_on_idx" ON "health_cases"("farm_id", "diagnosed_on");

-- CreateIndex
CREATE INDEX "health_cases_farm_id_status_idx" ON "health_cases"("farm_id", "status");

-- CreateIndex
CREATE INDEX "health_cases_animal_id_diagnosed_on_idx" ON "health_cases"("animal_id", "diagnosed_on");

-- CreateIndex
CREATE INDEX "health_treatments_case_id_start_date_idx" ON "health_treatments"("case_id", "start_date");

-- CreateIndex
CREATE INDEX "health_treatments_farm_id_withdrawal_end_date_idx" ON "health_treatments"("farm_id", "withdrawal_end_date");

-- AddForeignKey
ALTER TABLE "diseases" ADD CONSTRAINT "diseases_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_cases" ADD CONSTRAINT "health_cases_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_cases" ADD CONSTRAINT "health_cases_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_cases" ADD CONSTRAINT "health_cases_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_treatments" ADD CONSTRAINT "health_treatments_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_treatments" ADD CONSTRAINT "health_treatments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "health_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_treatments" ADD CONSTRAINT "health_treatments_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
