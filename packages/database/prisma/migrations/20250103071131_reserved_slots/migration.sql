-- CreateEnum
CREATE TYPE "ReservedSlotStatus" AS ENUM ('pending', 'reserved', 'tobedeleted');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_eventId_fkey";

-- CreateTable
CREATE TABLE "ReservedSlot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "bookedBy" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "ReservedSlotStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "ReservedSlot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservedSlot" ADD CONSTRAINT "ReservedSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
