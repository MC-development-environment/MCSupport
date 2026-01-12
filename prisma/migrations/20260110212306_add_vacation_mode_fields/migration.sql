-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isOnVacation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vacationEndDate" TIMESTAMP(3),
ADD COLUMN     "vacationMessage" TEXT,
ADD COLUMN     "vacationStartDate" TIMESTAMP(3);
