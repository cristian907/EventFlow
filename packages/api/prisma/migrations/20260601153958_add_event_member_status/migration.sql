-- CreateEnum
CREATE TYPE "EventMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "EventMember" ADD COLUMN     "status" "EventMemberStatus" NOT NULL DEFAULT 'ACTIVE';
