-- CreateEnum
CREATE TYPE "ExamPlanType" AS ENUM ('tentative', 'official');

-- CreateEnum
CREATE TYPE "ExamParseStatus" AS ENUM ('parsed', 'partial', 'failed');

-- CreateTable
CREATE TABLE "ExamNotice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "planType" "ExamPlanType" NOT NULL DEFAULT 'official',
    "parseStatus" "ExamParseStatus" NOT NULL DEFAULT 'parsed',
    "title" TEXT NOT NULL,
    "rawTitle" TEXT,
    "sourceText" TEXT,
    "courseCodeHint" TEXT,
    "courseNameHint" TEXT,
    "detailUrl" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "publishedAtRaw" TEXT,
    "publishedAt" TIMESTAMP(3),
    "sourcePage" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "noticeHash" TEXT NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" TIMESTAMP(3),
    "supersededReason" TEXT,
    "detailText" TEXT,
    "parseError" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "noticeId" TEXT,
    "planType" "ExamPlanType" NOT NULL DEFAULT 'official',
    "parseStatus" "ExamParseStatus" NOT NULL DEFAULT 'parsed',
    "noticeTitle" TEXT NOT NULL,
    "publishedAtRaw" TEXT,
    "publishedAtDate" TIMESTAMP(3),
    "detailUrl" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT,
    "examDate" TIMESTAMP(3),
    "examDateRaw" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "room" TEXT,
    "campus" TEXT,
    "examMetaRaw" TEXT,
    "studentId" TEXT,
    "studentName" TEXT,
    "classCourse" TEXT,
    "classStudent" TEXT,
    "birthDateRaw" TEXT,
    "birthDate" TIMESTAMP(3),
    "note" TEXT,
    "recordHash" TEXT NOT NULL,
    "rawRow" JSONB,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "isSuperseded" BOOLEAN NOT NULL DEFAULT false,
    "supersededAt" TIMESTAMP(3),
    "supersededReason" TEXT,
    "sourcePage" TEXT NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "parseError" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamNotice_userId_planType_isLatest_idx" ON "ExamNotice"("userId", "planType", "isLatest");

-- CreateIndex
CREATE INDEX "ExamNotice_userId_publishedAt_idx" ON "ExamNotice"("userId", "publishedAt");

-- CreateIndex
CREATE INDEX "ExamNotice_userId_title_idx" ON "ExamNotice"("userId", "title");

-- CreateIndex
CREATE INDEX "ExamNotice_userId_courseCodeHint_idx" ON "ExamNotice"("userId", "courseCodeHint");

-- CreateIndex
CREATE UNIQUE INDEX "ExamNotice_userId_noticeHash_key" ON "ExamNotice"("userId", "noticeHash");

-- CreateIndex
CREATE UNIQUE INDEX "ExamNotice_userId_detailUrl_key" ON "ExamNotice"("userId", "detailUrl");

-- CreateIndex
CREATE INDEX "ExamRecord_userId_planType_examDate_idx" ON "ExamRecord"("userId", "planType", "examDate");

-- CreateIndex
CREATE INDEX "ExamRecord_userId_courseCode_idx" ON "ExamRecord"("userId", "courseCode");

-- CreateIndex
CREATE INDEX "ExamRecord_userId_studentId_idx" ON "ExamRecord"("userId", "studentId");

-- CreateIndex
CREATE INDEX "ExamRecord_userId_studentName_idx" ON "ExamRecord"("userId", "studentName");

-- CreateIndex
CREATE INDEX "ExamRecord_userId_examDate_idx" ON "ExamRecord"("userId", "examDate");

-- CreateIndex
CREATE INDEX "ExamRecord_userId_isLatest_isSuperseded_idx" ON "ExamRecord"("userId", "isLatest", "isSuperseded");

-- CreateIndex
CREATE INDEX "ExamRecord_noticeId_idx" ON "ExamRecord"("noticeId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRecord_userId_recordHash_key" ON "ExamRecord"("userId", "recordHash");

-- AddForeignKey
ALTER TABLE "ExamNotice" ADD CONSTRAINT "ExamNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamNotice" ADD CONSTRAINT "ExamNotice_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRecord" ADD CONSTRAINT "ExamRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRecord" ADD CONSTRAINT "ExamRecord_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRecord" ADD CONSTRAINT "ExamRecord_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "ExamNotice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
