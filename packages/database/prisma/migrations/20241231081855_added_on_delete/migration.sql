-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "AvailabilityTimeSlot" DROP CONSTRAINT "AvailabilityTimeSlot_availabilityId_fkey";

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityTimeSlot" ADD CONSTRAINT "AvailabilityTimeSlot_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
