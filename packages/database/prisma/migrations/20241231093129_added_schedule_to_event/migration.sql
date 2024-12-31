/*
  Warnings:

  - Added the required column `scheduleId` to the `EventType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "scheduleId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
