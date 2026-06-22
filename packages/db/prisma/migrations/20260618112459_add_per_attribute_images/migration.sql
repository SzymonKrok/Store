-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageAttributeKey" TEXT;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "attributeValue" TEXT;

-- CreateIndex
CREATE INDEX "ProductImage_productId_attributeValue_idx" ON "ProductImage"("productId", "attributeValue");
