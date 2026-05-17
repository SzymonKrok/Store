/*
  Warnings:

  - You are about to drop the column `p24OrderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `p24SessionId` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "p24OrderId",
DROP COLUMN "p24SessionId",
ADD COLUMN     "stripeSessionId" TEXT;
