-- DropForeignKey
ALTER TABLE "hub_delivery_fees" DROP CONSTRAINT "hub_delivery_fees_addressId_fkey";

-- AddForeignKey
ALTER TABLE "hub_delivery_fees" ADD CONSTRAINT "hub_delivery_fees_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "saved_addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
