-- CreateEnum
CREATE TYPE "Belt" AS ENUM ('WHITE', 'BLUE', 'PURPLE', 'BROWN', 'BLACK');

-- CreateEnum
CREATE TYPE "TrainingExperience" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TrainingGoal" AS ENUM ('STRENGTH', 'GRIP', 'POWER', 'CONDITIONING', 'MOBILITY', 'HYPERTROPHY', 'ENDURANCE', 'INJURY_PREVENTION');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('STRENGTH', 'POWER', 'CORE', 'GRIP', 'MOBILITY', 'CONDITIONING', 'ACTIVATION', 'WARMUP');

-- CreateEnum
CREATE TYPE "MovementPattern" AS ENUM ('SQUAT', 'HINGE', 'HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'CARRY', 'ROTATION', 'ANTI_ROTATION', 'ANTI_EXTENSION', 'UNILATERAL', 'ISOMETRIC', 'LOCOMOTION', 'OTHER');

-- CreateEnum
CREATE TYPE "Equipment" AS ENUM ('BODYWEIGHT', 'DUMBBELL', 'MACHINE', 'CABLE', 'KETTLEBELL', 'SMITH_MACHINE', 'LEG_PRESS', 'BENCH', 'PULLUP_BAR', 'TREADMILL', 'BIKE', 'PLATE', 'TOWEL', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "belt" "Belt" NOT NULL DEFAULT 'WHITE',
    "beltDegree" INTEGER NOT NULL DEFAULT 0,
    "experience" "TrainingExperience" NOT NULL DEFAULT 'BEGINNER',
    "giTraining" BOOLEAN NOT NULL DEFAULT true,
    "noGiTraining" BOOLEAN NOT NULL DEFAULT false,
    "bjjDaysPerWeek" INTEGER NOT NULL DEFAULT 0,
    "strengthDaysPerWeek" INTEGER NOT NULL DEFAULT 0,
    "sessionDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "goals" "TrainingGoal"[],
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "currentXp" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteRestriction" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "bodyArea" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "movement" "MovementPattern" NOT NULL,
    "equipment" "Equipment"[],
    "difficulty" "TrainingExperience" NOT NULL DEFAULT 'BEGINNER',
    "description" TEXT,
    "instructions" TEXT[],
    "commonMistakes" TEXT[],
    "bjjTransfer" TEXT[],
    "muscles" TEXT[],
    "safetyNotes" TEXT[],
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "videoDurationSeconds" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAlternative" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "alternativeId" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "ExerciseAlternative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_name_key" ON "Exercise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseAlternative_exerciseId_alternativeId_key" ON "ExerciseAlternative"("exerciseId", "alternativeId");

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteRestriction" ADD CONSTRAINT "AthleteRestriction_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAlternative" ADD CONSTRAINT "ExerciseAlternative_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAlternative" ADD CONSTRAINT "ExerciseAlternative_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
