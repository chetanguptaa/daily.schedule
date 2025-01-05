/*
  Warnings:

  - Added the required column `meetingDate` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meetingDate" TIMESTAMP(3) NOT NULL;
