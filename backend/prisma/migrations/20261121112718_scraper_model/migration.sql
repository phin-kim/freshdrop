-- CreateTable
CREATE TABLE "scraper_runs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "itemsScraped" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "unchanged" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scraper_runs_runId_key" ON "scraper_runs"("runId");

-- CreateIndex
CREATE INDEX "scraper_runs_storeId_idx" ON "scraper_runs"("storeId");
