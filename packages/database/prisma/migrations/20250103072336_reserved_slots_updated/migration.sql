/*
  Warnings:

  - The values [pending,tobedeleted] on the enum `ReservedSlotStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bookedBy` on the `ReservedSlot` table. All the data in the column will be lost.
  - Added the required column `reservedBy` to the `ReservedSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservedTill` to the `ReservedSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReservedSlotStatus_new" AS ENUM ('reserved', 'notreserved');
ALTER TABLE "ReservedSlot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ReservedSlot" ALTER COLUMN "status" TYPE "ReservedSlotStatus_new" USING ("status"::text::"ReservedSlotStatus_new");
ALTER TYPE "ReservedSlotStatus" RENAME TO "ReservedSlotStatus_old";
ALTER TYPE "ReservedSlotStatus_new" RENAME TO "ReservedSlotStatus";
DROP TYPE "ReservedSlotStatus_old";
ALTER TABLE "ReservedSlot" ALTER COLUMN "status" SET DEFAULT 'reserved';
COMMIT;

-- AlterTable
ALTER TABLE "ReservedSlot" DROP COLUMN "bookedBy",
ADD COLUMN     "reservedBy" TEXT NOT NULL,
ADD COLUMN     "reservedTill" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'reserved';
