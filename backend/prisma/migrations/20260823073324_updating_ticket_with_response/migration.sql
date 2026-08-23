/*
  Warnings:

  - The `priority` column on the `tickets` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('HIGH', 'LOW', 'MEDIUM');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "ticketResponse" TEXT,
DROP COLUMN "priority",
ADD COLUMN     "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM';
