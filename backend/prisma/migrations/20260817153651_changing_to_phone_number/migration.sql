/*
  Warnings:

  - You are about to drop the column `phone` on the `riders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `riders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phoneNumber` to the `riders` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "riders_phone_key";

-- AlterTable
ALTER TABLE "riders" DROP COLUMN "phone",
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ALTER COLUMN "vehiclePlate" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "riders_phoneNumber_key" ON "riders"("phoneNumber");
