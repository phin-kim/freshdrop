/*
  Warnings:

  - Made the column `email` on table `riders` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RiderAccountStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE');

-- AlterTable
ALTER TABLE "riders" ADD COLUMN     "accountStatus" "RiderAccountStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "activationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "activationTokenHash" TEXT,
ALTER COLUMN "email" SET NOT NULL;
