-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "destinationLabel" TEXT;

-- CreateTable
CREATE TABLE "saved_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinationLabel" TEXT,
    "deliveryDestination" TEXT NOT NULL,
    "apartmentName" TEXT NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "landmark" TEXT,
    "customerLatitude" DOUBLE PRECISION NOT NULL,
    "customerLongitude" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
