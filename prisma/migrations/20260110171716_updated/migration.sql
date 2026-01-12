-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "assignedById" TEXT;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
