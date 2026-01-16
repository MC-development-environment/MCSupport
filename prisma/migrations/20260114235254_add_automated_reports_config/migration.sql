-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL');

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "automatedReportsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reportFrequency" "ReportFrequency" NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN     "reportRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[];
