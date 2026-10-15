/*
  Warnings:

  - You are about to drop the column `currentLevel` on the `AthleteProfile` table. All the data in the column will be lost.
  - You are about to drop the column `currentStreak` on the `AthleteProfile` table. All the data in the column will be lost.
  - You are about to drop the column `currentXp` on the `AthleteProfile` table. All the data in the column will be lost.
  - You are about to drop the column `longestStreak` on the `AthleteProfile` table. All the data in the column will be lost.
  - You are about to drop the column `totalXp` on the `AthleteProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GamificationEventType" AS ENUM ('WORKOUT_COMPLETED', 'WEEK_COMPLETED', 'FIRST_WORKOUT', 'STREAK_MILESTONE', 'ACHIEVEMENT_UNLOCKED', 'PROGRAM_COMPLETED', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "GamificationSourceType" AS ENUM ('WORKOUT_SESSION', 'PROGRAM_WEEK', 'ACHIEVEMENT', 'TRAINING_PROGRAM', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('TRAINING', 'CONSISTENCY', 'MILESTONE', 'PROGRAM');

-- AlterTable
ALTER TABLE "AthleteProfile" DROP COLUMN "currentLevel",
DROP COLUMN "currentStreak",
DROP COLUMN "currentXp",
DROP COLUMN "longestStreak",
DROP COLUMN "totalXp";

-- CreateTable
CREATE TABLE "GamificationProfile" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedWeek" INTEGER,
    "lastCompletedProgramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamificationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamificationEvent" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "type" "GamificationEventType" NOT NULL,
    "sourceType" "GamificationSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "AchievementCategory" NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteAchievement" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GamificationProfile_athleteId_key" ON "GamificationProfile"("athleteId");

-- CreateIndex
CREATE INDEX "GamificationEvent_athleteId_createdAt_idx" ON "GamificationEvent"("athleteId", "createdAt");

-- CreateIndex
CREATE INDEX "GamificationEvent_sourceType_sourceId_idx" ON "GamificationEvent"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "GamificationEvent_athleteId_type_sourceType_sourceId_key" ON "GamificationEvent"("athleteId", "type", "sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "AthleteAchievement_athleteId_unlockedAt_idx" ON "AthleteAchievement"("athleteId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteAchievement_athleteId_achievementId_key" ON "AthleteAchievement"("athleteId", "achievementId");

-- AddForeignKey
ALTER TABLE "GamificationProfile" ADD CONSTRAINT "GamificationProfile_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationEvent" ADD CONSTRAINT "GamificationEvent_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAchievement" ADD CONSTRAINT "AthleteAchievement_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteAchievement" ADD CONSTRAINT "AthleteAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
