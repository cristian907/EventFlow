-- AlterTable
ALTER TABLE "BcvRate" ADD COLUMN     "usdtRate" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "rateSource" TEXT NOT NULL DEFAULT 'CUSTOM';

-- AlterTable
ALTER TABLE "TicketType" ADD COLUMN     "usdPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;
