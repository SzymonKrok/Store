-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "enableGuestCheckout" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showBestsellers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showQuantitySelector" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showReviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showStockBadge" BOOLEAN NOT NULL DEFAULT true;
