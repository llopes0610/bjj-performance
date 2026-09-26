/*
  Warnings:

  - Made the column `age` on table `AthleteProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `weightKg` on table `AthleteProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `heightCm` on table `AthleteProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "TrainingPreference" AS ENUM ('AVOID_BARBELL', 'AVOID_HIGH_IMPACT', 'PREFER_MACHINES', 'PREFER_DUMBBELLS', 'PREFER_CABLES', 'PREFER_BODYWEIGHT');

-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "bjjTrainingDays" "WeekDay"[],
ADD COLUMN     "strengthTrainingDays" "WeekDay"[],
ADD COLUMN     "trainingPreferences" "TrainingPreference"[],
ALTER COLUMN "age" SET NOT NULL,
ALTER COLUMN "weightKg" SET NOT NULL,
ALTER COLUMN "heightCm" SET NOT NULL;

-- AlterTable
ALTER TABLE "AthleteRestriction" ADD COLUMN     "currentlyPainful" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medicallyCleared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recovered" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AthleteGoalPriority" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "goal" "TrainingGoal" NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteGoalPriority_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AthleteGoalPriority_athleteId_goal_key" ON "AthleteGoalPriority"("athleteId", "goal");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteGoalPriority_athleteId_priority_key" ON "AthleteGoalPriority"("athleteId", "priority");

-- AddForeignKey
ALTER TABLE "AthleteGoalPriority" ADD CONSTRAINT "AthleteGoalPriority_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
