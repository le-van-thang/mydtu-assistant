/*
  Warnings:

  - A unique constraint covering the columns `[userId,courseCode,classCode,semester]` on the table `Transcript` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Transcript_userId_courseCode_semester_key";

-- AlterTable
ALTER TABLE "Transcript" ADD COLUMN     "classCode" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Transcript_userId_classCode_idx" ON "Transcript"("userId", "classCode");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_userId_courseCode_classCode_semester_key" ON "Transcript"("userId", "courseCode", "classCode", "semester");
