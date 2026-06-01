/*
  Warnings:

  - You are about to drop the column `date` on the `Event` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable (Safe Migration with Data Preservation)
-- 1. Add new columns as nullable first to support existing rows
ALTER TABLE "Event" 
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3);

-- 2. Backfill dates from the existing single-day 'date' column
UPDATE "Event" 
SET "startDate" = "date", 
    "endDate" = "date";

-- 3. Set columns as NOT NULL now that they are populated
ALTER TABLE "Event" 
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;

-- 4. Drop the old single-day 'date' column safely
ALTER TABLE "Event" 
DROP COLUMN "date";
