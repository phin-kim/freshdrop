-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
