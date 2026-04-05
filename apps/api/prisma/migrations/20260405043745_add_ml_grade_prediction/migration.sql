-- CreateEnum
CREATE TYPE "ML_RowStatus" AS ENUM ('pending', 'validated', 'excluded');

-- CreateEnum
CREATE TYPE "ML_FeatureSet" AS ENUM ('v1_basic', 'v2_extended');

-- CreateTable
CREATE TABLE "ML_GradeDataset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "classCode" TEXT NOT NULL DEFAULT '',
    "courseName" TEXT,
    "credits" INTEGER NOT NULL,
    "sectionType" "SectionType" NOT NULL DEFAULT 'LEC',
    "midTermScore" DOUBLE PRECISION,
    "attendanceScore" DOUBLE PRECISION,
    "cumulativeGPA" DOUBLE PRECISION,
    "creditEarned" INTEGER,
    "semesterCourseLoad" INTEGER,
    "homeworkScore" DOUBLE PRECISION,
    "quizScore" DOUBLE PRECISION,
    "absences" INTEGER,
    "finalScore" DOUBLE PRECISION,
    "finalGpa4" DOUBLE PRECISION,
    "courseStatus" "CourseStatus" NOT NULL DEFAULT 'unknown',
    "featureSet" "ML_FeatureSet" NOT NULL DEFAULT 'v1_basic',
    "rowStatus" "ML_RowStatus" NOT NULL DEFAULT 'pending',
    "excludeReason" TEXT,
    "transcriptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ML_GradeDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ML_ModelVersion" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "featureSet" "ML_FeatureSet" NOT NULL,
    "trainSampleCount" INTEGER,
    "trainTestSplit" DOUBLE PRECISION,
    "trainedAt" TIMESTAMP(3),
    "metricMAE" DOUBLE PRECISION,
    "metricRMSE" DOUBLE PRECISION,
    "metricR2" DOUBLE PRECISION,
    "metricAccuracy05" DOUBLE PRECISION,
    "hyperparams" JSONB,
    "featureImportances" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ML_ModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ML_Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "predictedScore" DOUBLE PRECISION NOT NULL,
    "confidenceLow" DOUBLE PRECISION,
    "confidenceHigh" DOUBLE PRECISION,
    "passProbability" DOUBLE PRECISION,
    "featureSnapshot" JSONB,
    "actualScore" DOUBLE PRECISION,
    "absoluteError" DOUBLE PRECISION,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ML_Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ML_FeatureImportance" (
    "id" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ML_FeatureImportance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ML_GradeDataset_userId_semester_idx" ON "ML_GradeDataset"("userId", "semester");

-- CreateIndex
CREATE INDEX "ML_GradeDataset_userId_courseCode_idx" ON "ML_GradeDataset"("userId", "courseCode");

-- CreateIndex
CREATE INDEX "ML_GradeDataset_rowStatus_finalScore_idx" ON "ML_GradeDataset"("rowStatus", "finalScore");

-- CreateIndex
CREATE INDEX "ML_GradeDataset_featureSet_rowStatus_idx" ON "ML_GradeDataset"("featureSet", "rowStatus");

-- CreateIndex
CREATE INDEX "ML_GradeDataset_studentId_idx" ON "ML_GradeDataset"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ML_GradeDataset_userId_courseCode_classCode_semester_key" ON "ML_GradeDataset"("userId", "courseCode", "classCode", "semester");

-- CreateIndex
CREATE INDEX "ML_ModelVersion_modelName_isActive_idx" ON "ML_ModelVersion"("modelName", "isActive");

-- CreateIndex
CREATE INDEX "ML_ModelVersion_featureSet_isActive_idx" ON "ML_ModelVersion"("featureSet", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ML_ModelVersion_modelName_version_key" ON "ML_ModelVersion"("modelName", "version");

-- CreateIndex
CREATE INDEX "ML_Prediction_userId_datasetId_idx" ON "ML_Prediction"("userId", "datasetId");

-- CreateIndex
CREATE INDEX "ML_Prediction_userId_predictedAt_idx" ON "ML_Prediction"("userId", "predictedAt");

-- CreateIndex
CREATE INDEX "ML_Prediction_modelVersionId_idx" ON "ML_Prediction"("modelVersionId");

-- CreateIndex
CREATE INDEX "ML_Prediction_actualScore_idx" ON "ML_Prediction"("actualScore");

-- CreateIndex
CREATE INDEX "ML_FeatureImportance_modelVersionId_rank_idx" ON "ML_FeatureImportance"("modelVersionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ML_FeatureImportance_modelVersionId_featureName_key" ON "ML_FeatureImportance"("modelVersionId", "featureName");

-- AddForeignKey
ALTER TABLE "ML_GradeDataset" ADD CONSTRAINT "ML_GradeDataset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ML_GradeDataset" ADD CONSTRAINT "ML_GradeDataset_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ML_Prediction" ADD CONSTRAINT "ML_Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ML_Prediction" ADD CONSTRAINT "ML_Prediction_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "ML_GradeDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ML_Prediction" ADD CONSTRAINT "ML_Prediction_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ML_ModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ML_FeatureImportance" ADD CONSTRAINT "ML_FeatureImportance_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "ML_ModelVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
