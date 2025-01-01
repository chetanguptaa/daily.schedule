/*
  Warnings:

  - You are about to drop the column `availabilityId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `timeSlotId` on the `Event` table. All the data in the column will be lost.
  - Added the required column `scheduleId` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_timeSlotId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "availabilityId",
DROP COLUMN "timeSlotId",
ADD COLUMN     "scheduleId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
