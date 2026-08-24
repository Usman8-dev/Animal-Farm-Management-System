-- CreateTable
CREATE TABLE "weight_history" (
    "id" SERIAL NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "weight_kg" DECIMAL(10,2) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "source" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "weight_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_valuations" (
    "id" SERIAL NOT NULL,
    "animal_id" INTEGER NOT NULL,
    "value_amount" DECIMAL(14,2) NOT NULL,
    "basis" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "animal_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weight_history_animal_id_effective_from_idx" ON "weight_history"("animal_id", "effective_from");

-- CreateIndex
CREATE INDEX "animal_valuations_animal_id_effective_from_idx" ON "animal_valuations"("animal_id", "effective_from");

-- AddForeignKey
ALTER TABLE "weight_history" ADD CONSTRAINT "weight_history_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_valuations" ADD CONSTRAINT "animal_valuations_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
