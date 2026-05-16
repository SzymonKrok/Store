-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('COURIER', 'PARCEL_LOCKER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'COURIER',
ADD COLUMN     "fakturowniaId" TEXT,
ADD COLUMN     "inpostShipmentId" TEXT,
ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "lockerCode" TEXT,
ADD COLUMN     "p24OrderId" TEXT,
ADD COLUMN     "p24SessionId" TEXT,
ADD COLUMN     "shippingLabelUrl" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "wantsInvoice" BOOLEAN NOT NULL DEFAULT false;
