/*
  Warnings:

  - You are about to drop the `ReservedSlot` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReservedSlot" DROP CONSTRAINT "ReservedSlot_eventId_fkey";

-- DropTable
DROP TABLE "ReservedSlot";
