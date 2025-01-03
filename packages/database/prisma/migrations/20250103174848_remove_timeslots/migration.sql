/*
  Warnings:

  - The values [pending,confirmed,rejected] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [reserved,notreserved] on the enum `ReservedSlotStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `TimeSlot` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endTime` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `dayOfWeek` on the `Availability` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTEF');
ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReservedSlotStatus_new" AS ENUM ('RESERVED', 'NOT_RESERVED');
ALTER TABLE "ReservedSlot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ReservedSlot" ALTER COLUMN "status" TYPE "ReservedSlotStatus_new" USING ("status"::text::"ReservedSlotStatus_new");
ALTER TYPE "ReservedSlotStatus" RENAME TO "ReservedSlotStatus_old";
ALTER TYPE "ReservedSlotStatus_new" RENAME TO "ReservedSlotStatus";
DROP TYPE "ReservedSlotStatus_old";
ALTER TABLE "ReservedSlot" ALTER COLUMN "status" SET DEFAULT 'RESERVED';
COMMIT;

-- DropForeignKey
ALTER TABLE "TimeSlot" DROP CONSTRAINT "TimeSlot_availabilityId_fkey";

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL,
DROP COLUMN "dayOfWeek",
ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL;

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ReservedSlot" ALTER COLUMN "status" SET DEFAULT 'RESERVED';

-- DropTable
DROP TABLE "TimeSlot";
