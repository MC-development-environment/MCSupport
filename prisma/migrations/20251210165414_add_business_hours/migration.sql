-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "businessHoursEnd" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "businessHoursStart" INTEGER NOT NULL DEFAULT 9;
