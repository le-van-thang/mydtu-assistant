/*
  Warnings:

  - A unique constraint covering the columns `[userId,occurrenceDate,courseCode,startTime,room]` on the table `Timetable` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `occurrenceDate` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Timetable_userId_semester_courseCode_dayOfWeek_startTime_ro_key";

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "occurrenceDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weekEndDate" TIMESTAMP(3),
ADD COLUMN     "weekLabel" TEXT,
ADD COLUMN     "weekStartDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Timetable_userId_occurrenceDate_idx" ON "Timetable"("userId", "occurrenceDate");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_userId_occurrenceDate_courseCode_startTime_room_key" ON "Timetable"("userId", "occurrenceDate", "courseCode", "startTime", "room");
