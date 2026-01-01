-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('passed', 'failed', 'retaken', 'in_progress', 'unknown');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('LEC', 'LAB', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "sourcePage" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'SUCCESS',
    "recordCounts" JSONB,
    "diffSummary" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "score10" DOUBLE PRECISION,
    "letter" TEXT,
    "gpa4" DOUBLE PRECISION,
    "semester" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'unknown',
    "componentsBreakdown" JSONB,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "sourcePage" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "semester" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "campus" TEXT,
    "weeksIncluded" TEXT,
    "weeksCanceled" TEXT,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "sourcePage" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "semester" TEXT NOT NULL,
    "classCode" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "type" "SectionType" NOT NULL DEFAULT 'OTHER',
    "capacityStatus" TEXT NOT NULL,
    "note" TEXT,
    "scheduleSlots" JSONB,
    "weeksIncluded" TEXT,
    "weeksCanceled" TEXT,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "sourcePage" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "semester" TEXT NOT NULL,
    "lecturer" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT,
    "answers" JSONB NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "sourcePage" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ImportSession_userId_startedAt_idx" ON "ImportSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ImportSession_adapterKey_adapterVersion_idx" ON "ImportSession"("adapterKey", "adapterVersion");

-- CreateIndex
CREATE INDEX "Transcript_userId_semester_idx" ON "Transcript"("userId", "semester");

-- CreateIndex
CREATE INDEX "Transcript_courseCode_idx" ON "Transcript"("courseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_userId_courseCode_semester_key" ON "Transcript"("userId", "courseCode", "semester");

-- CreateIndex
CREATE INDEX "Timetable_userId_semester_idx" ON "Timetable"("userId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_userId_semester_courseCode_dayOfWeek_startTime_en_key" ON "Timetable"("userId", "semester", "courseCode", "dayOfWeek", "startTime", "endTime", "room");

-- CreateIndex
CREATE INDEX "ClassSection_userId_semester_idx" ON "ClassSection"("userId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSection_userId_semester_classCode_key" ON "ClassSection"("userId", "semester", "classCode");

-- CreateIndex
CREATE INDEX "EvaluationDraft_userId_semester_idx" ON "EvaluationDraft"("userId", "semester");

-- AddForeignKey
ALTER TABLE "ImportSession" ADD CONSTRAINT "ImportSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationDraft" ADD CONSTRAINT "EvaluationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationDraft" ADD CONSTRAINT "EvaluationDraft_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
