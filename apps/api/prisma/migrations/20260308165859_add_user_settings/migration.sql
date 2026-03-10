-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'vi',
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "webPush" BOOLEAN NOT NULL DEFAULT false,
    "timetableReminders" BOOLEAN NOT NULL DEFAULT true,
    "deadlineReminders" BOOLEAN NOT NULL DEFAULT true,
    "gradeAlerts" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT false,
    "rememberDevice" BOOLEAN NOT NULL DEFAULT true,
    "analyticsOptIn" BOOLEAN NOT NULL DEFAULT false,
    "onboardingDismissed" BOOLEAN NOT NULL DEFAULT false,
    "lastManualSyncAt" TIMESTAMP(3),
    "lastExportAt" TIMESTAMP(3),
    "avatarDataUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
