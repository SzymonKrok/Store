-- AlterTable
ALTER TABLE "Product"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "keyFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "specifications" JSONB;
