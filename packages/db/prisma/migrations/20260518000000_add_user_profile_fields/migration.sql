-- AlterTable
ALTER TABLE "User" ADD COLUMN "defaultAddress" JSONB,
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "phone" TEXT;
