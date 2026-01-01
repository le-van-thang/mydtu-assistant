/*
  Warnings:

  - A unique constraint covering the columns `[userId,adapterKey,adapterVersion,payloadHash]` on the table `ImportSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,semester,courseCode,dayOfWeek,startTime,room]` on the table `Timetable` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Timetable_userId_semester_courseCode_dayOfWeek_startTime_en_key";

-- AlterTable
ALTER TABLE "ImportSession" ADD COLUMN     "payloadHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ImportSession_userId_adapterKey_adapterVersion_payloadHash_key" ON "ImportSession"("userId", "adapterKey", "adapterVersion", "payloadHash");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_userId_semester_courseCode_dayOfWeek_startTime_ro_key" ON "Timetable"("userId", "semester", "courseCode", "dayOfWeek", "startTime", "room");
