/*
  Warnings:

  - A unique constraint covering the columns `[pregnancy_id]` on the table `births` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "pregnancies" DROP CONSTRAINT "pregnancies_sire_id_fkey";

-- DropIndex
DROP INDEX "birth_kids_birth_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "births_pregnancy_id_key" ON "births"("pregnancy_id");

-- AddForeignKey
ALTER TABLE "pregnancies" ADD CONSTRAINT "pregnancies_sire_id_fkey" FOREIGN KEY ("sire_id") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
