-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[];
