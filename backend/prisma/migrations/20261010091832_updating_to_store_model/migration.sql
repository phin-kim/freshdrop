/*
  Warnings:

  - You are about to drop the column `hubProductConfigId` on the `price_logs` table. All the data in the column will be lost.
  - You are about to drop the `hub_product_configs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `storeProductConfigId` to the `price_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "StockStatus" ADD VALUE 'LOW_STOCK';

-- DropForeignKey
ALTER TABLE "hub_delivery_fees" DROP CONSTRAINT "hub_delivery_fees_addressId_fkey";

-- DropForeignKey
ALTER TABLE "hub_delivery_fees" DROP CONSTRAINT "hub_delivery_fees_hubId_fkey";

-- DropForeignKey
ALTER TABLE "hub_product_configs" DROP CONSTRAINT "hub_product_configs_hubId_fkey";

-- DropForeignKey
ALTER TABLE "hub_product_configs" DROP CONSTRAINT "hub_product_configs_productId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "payment_transactions" DROP CONSTRAINT "payment_transactions_orderId_fkey";

-- DropForeignKey
ALTER TABLE "payment_transactions" DROP CONSTRAINT "payment_transactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "price_logs" DROP CONSTRAINT "price_logs_hubProductConfigId_fkey";

-- DropForeignKey
ALTER TABLE "riders" DROP CONSTRAINT "riders_userId_fkey";

-- DropForeignKey
ALTER TABLE "saved_addresses" DROP CONSTRAINT "saved_addresses_userId_fkey";

-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_walletId_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_userId_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "storeId" TEXT;

-- AlterTable
ALTER TABLE "price_logs" DROP COLUMN "hubProductConfigId",
ADD COLUMN     "storeProductConfigId" TEXT NOT NULL;

-- DropTable
DROP TABLE "hub_product_configs";

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourcingType" "SourcingType" NOT NULL,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_product_configs" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "store_product_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_hubId_slug_key" ON "stores"("hubId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "store_product_configs_storeId_productId_key" ON "store_product_configs"("storeId", "productId");

-- AddForeignKey
ALTER TABLE "price_logs" ADD CONSTRAINT "price_logs_storeProductConfigId_fkey" FOREIGN KEY ("storeProductConfigId") REFERENCES "store_product_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_delivery_fees" ADD CONSTRAINT "hub_delivery_fees_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "saved_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_delivery_fees" ADD CONSTRAINT "hub_delivery_fees_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_configs" ADD CONSTRAINT "store_product_configs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_product_configs" ADD CONSTRAINT "store_product_configs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riders" ADD CONSTRAINT "riders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
