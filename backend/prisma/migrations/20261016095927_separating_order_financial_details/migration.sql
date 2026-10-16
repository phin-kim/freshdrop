/*
  Warnings:

  - You are about to drop the column `deliveryFee` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFee` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "deliveryFee",
DROP COLUMN "serviceFee",
DROP COLUMN "subtotal",
DROP COLUMN "totalAmount";

-- CreateTable
CREATE TABLE "order_financials" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "serviceFee" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "baseDeliveryFee" DECIMAL(10,2) NOT NULL,
    "additionalDistanceFee" DECIMAL(10,2) NOT NULL,
    "riderPayout" DECIMAL(10,2) NOT NULL,
    "platformCommission" DECIMAL(10,2) NOT NULL,
    "platformTotal" DECIMAL(10,2) NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_financials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_financials_orderId_key" ON "order_financials"("orderId");

-- AddForeignKey
ALTER TABLE "order_financials" ADD CONSTRAINT "order_financials_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
