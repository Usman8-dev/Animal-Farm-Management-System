-- CreateEnum
CREATE TYPE "FarmRole" AS ENUM ('manager', 'worker');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'pending', 'removed');

-- CreateTable
CREATE TABLE "person" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cnic_number" TEXT,
    "gender" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "createdby" INTEGER,
    "updatedby" INTEGER,
    "deletedby" INTEGER,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_cnic_number_key" ON "person"("cnic_number");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_updatedby_fkey" FOREIGN KEY ("updatedby") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_deletedby_fkey" FOREIGN KEY ("deletedby") REFERENCES "person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
