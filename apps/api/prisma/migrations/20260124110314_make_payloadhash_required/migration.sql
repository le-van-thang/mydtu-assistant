/*
  Warnings:

  - Made the column `payloadHash` on table `ImportSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `room` on table `Timetable` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ImportSession" ALTER COLUMN "payloadHash" SET NOT NULL;

-- AlterTable
ALTER TABLE "Timetable" ALTER COLUMN "room" SET NOT NULL;
