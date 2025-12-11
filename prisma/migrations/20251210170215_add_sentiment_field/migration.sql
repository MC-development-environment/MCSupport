-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL';
