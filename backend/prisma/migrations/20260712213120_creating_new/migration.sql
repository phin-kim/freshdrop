-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_hubId_fkey";

-- AlterTable
ALTER TABLE "hubs" ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "hub_delivery_fees" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "hub_delivery_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HubToOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HubToOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "hub_delivery_fees_addressId_hubId_key" ON "hub_delivery_fees"("addressId", "hubId");

-- CreateIndex
CREATE INDEX "_HubToOrder_B_index" ON "_HubToOrder"("B");

-- AddForeignKey
ALTER TABLE "hub_delivery_fees" ADD CONSTRAINT "hub_delivery_fees_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "saved_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hub_delivery_fees" ADD CONSTRAINT "hub_delivery_fees_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HubToOrder" ADD CONSTRAINT "_HubToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HubToOrder" ADD CONSTRAINT "_HubToOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
