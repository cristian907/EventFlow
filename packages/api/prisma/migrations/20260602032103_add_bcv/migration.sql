-- DropForeignKey
ALTER TABLE "ExchangeRate" DROP CONSTRAINT "ExchangeRate_setBy_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "autoSyncBcv" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ExchangeRate" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ALTER COLUMN "setBy" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BcvRate" (
    "id" TEXT NOT NULL,
    "usdRate" DECIMAL(65,30) NOT NULL,
    "eurRate" DECIMAL(65,30) NOT NULL,
    "valueDate" TIMESTAMP(3),
    "scrapedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BcvRate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_setBy_fkey" FOREIGN KEY ("setBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
