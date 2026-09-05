-- Adds the vaccination category (Normal / Seasonal) to administered doses.
ALTER TABLE "animal_vaccinations" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'NORMAL';