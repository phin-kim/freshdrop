/*
  Warnings:

  - You are about to drop the column `deliveryPhotoUrl` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "deliveryPhotoUrl",
ADD COLUMN     "deliveryPin" TEXT NOT NULL DEFAULT '0000';
