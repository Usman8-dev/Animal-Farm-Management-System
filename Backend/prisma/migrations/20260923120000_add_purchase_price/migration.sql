-- AlterTable
-- Purchase price for animals acquired via PURCHASED (NULL for BORN_IN_FARM).
ALTER TABLE "animals" ADD COLUMN "purchase_price" DECIMAL(12,2);
