-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "freeShipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingCourierCost" DECIMAL(10,2) NOT NULL DEFAULT 14.99,
ADD COLUMN     "shippingLockerCost" DECIMAL(10,2) NOT NULL DEFAULT 9.99;
