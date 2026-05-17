-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "compareAtPrice" DECIMAL(10,2),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
