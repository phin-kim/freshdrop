/*
  Warnings:

  - You are about to drop the column `SLUG` on the `hubs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `hubs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `hubs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "hubs_SLUG_key";

-- AlterTable
ALTER TABLE "hubs" DROP COLUMN "SLUG",
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "hubs_slug_key" ON "hubs"("slug");
