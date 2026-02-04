-- CreateEnum
CREATE TYPE "WorkLogStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'DEVELOPMENT';
ALTER TYPE "ActivityType" ADD VALUE 'CONFERENCE';

-- AlterTable
ALTER TABLE "UserSkill" ADD COLUMN     "assignedById" TEXT;

-- AlterTable
ALTER TABLE "WorkLog" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "status" "WorkLogStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE INDEX "WorkLog_status_idx" ON "WorkLog"("status");

-- AddForeignKey
ALTER TABLE "UserSkill" ADD CONSTRAINT "UserSkill_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
