-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isOrganic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isSeasonal" BOOLEAN NOT NULL DEFAULT false;
