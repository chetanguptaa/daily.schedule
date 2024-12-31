/*
  Warnings:

  - A unique constraint covering the columns `[link]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Event_link_key" ON "Event"("link");
