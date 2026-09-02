/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `wallet_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "transactionStatus" TEXT NOT NULL DEFAULT 'QUEUED',
ADD COLUMN     "webhookReceived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_idempotencyKey_key" ON "wallet_transactions"("idempotencyKey");
