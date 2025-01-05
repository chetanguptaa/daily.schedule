/*
  Warnings:

  - You are about to drop the column `bookedBy` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `ReservedSlot` table. All the data in the column will be lost.
  - Added the required column `dayOfWeek` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestEmail` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestName` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dayOfWeek` to the `ReservedSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `ReservedSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "bookedBy",
DROP COLUMN "date",
ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "guestEmail" TEXT NOT NULL,
ADD COLUMN     "guestName" TEXT NOT NULL,
ADD COLUMN     "guestNotes" TEXT;

-- AlterTable
ALTER TABLE "ReservedSlot" DROP COLUMN "date",
ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL,
ADD COLUMN     "endTime" TEXT NOT NULL;
