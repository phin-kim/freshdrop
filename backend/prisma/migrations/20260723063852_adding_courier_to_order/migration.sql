-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ASSIGNED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "courierTelegramId" TEXT;
