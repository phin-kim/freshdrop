/*
  Warnings:

  - You are about to drop the column `isAvailable` on the `riders` table. All the data in the column will be lost.
  - Added the required column `vehiclePlate` to the `riders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RiderStatus" AS ENUM ('AVAILABLE', 'ON_DELIVERY', 'ON_BREAK', 'OFFLINE');

-- AlterTable
ALTER TABLE "riders" DROP COLUMN "isAvailable",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "dispatchHub" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "status" "RiderStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "vehiclePlate" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "riders_isDeleted_idx" ON "riders"("isDeleted");
