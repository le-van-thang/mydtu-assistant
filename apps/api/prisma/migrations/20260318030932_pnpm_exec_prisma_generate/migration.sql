-- CreateTable
CREATE TABLE "TranscriptComponent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "importId" TEXT,
    "transcriptId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "classCode" TEXT NOT NULL DEFAULT '',
    "courseName" TEXT,
    "componentKey" TEXT,
    "componentLabel" TEXT NOT NULL,
    "score1" DOUBLE PRECISION,
    "score2" DOUBLE PRECISION,
    "scaleScore" DOUBLE PRECISION,
    "weightPercent" DOUBLE PRECISION,
    "contributionScore" DOUBLE PRECISION,
    "contributionMax" DOUBLE PRECISION,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "rawText" TEXT,
    "adapterKey" TEXT NOT NULL,
    "adapterVersion" TEXT NOT NULL,
    "sourcePage" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranscriptComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranscriptComponent_userId_semester_idx" ON "TranscriptComponent"("userId", "semester");

-- CreateIndex
CREATE INDEX "TranscriptComponent_userId_courseCode_idx" ON "TranscriptComponent"("userId", "courseCode");

-- CreateIndex
CREATE INDEX "TranscriptComponent_userId_classCode_idx" ON "TranscriptComponent"("userId", "classCode");

-- CreateIndex
CREATE INDEX "TranscriptComponent_transcriptId_idx" ON "TranscriptComponent"("transcriptId");

-- CreateIndex
CREATE INDEX "TranscriptComponent_userId_transcriptId_displayOrder_idx" ON "TranscriptComponent"("userId", "transcriptId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptComponent_transcriptId_componentLabel_displayOrde_key" ON "TranscriptComponent"("transcriptId", "componentLabel", "displayOrder");

-- AddForeignKey
ALTER TABLE "TranscriptComponent" ADD CONSTRAINT "TranscriptComponent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptComponent" ADD CONSTRAINT "TranscriptComponent_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ImportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptComponent" ADD CONSTRAINT "TranscriptComponent_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
