-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "sessionRpe" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSessionExercise" (
    "id" TEXT NOT NULL,
    "workoutSessionId" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSessionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "workoutSessionExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "reps" INTEGER,
    "rpe" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutSession_athleteId_status_idx" ON "WorkoutSession"("athleteId", "status");

-- CreateIndex
CREATE INDEX "WorkoutSession_workoutId_idx" ON "WorkoutSession"("workoutId");

-- CreateIndex
CREATE INDEX "WorkoutSessionExercise_workoutExerciseId_idx" ON "WorkoutSessionExercise"("workoutExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSessionExercise_workoutSessionId_workoutExerciseId_key" ON "WorkoutSessionExercise"("workoutSessionId", "workoutExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSet_workoutSessionExerciseId_setNumber_key" ON "WorkoutSet"("workoutSessionExerciseId", "setNumber");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionExercise" ADD CONSTRAINT "WorkoutSessionExercise_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSessionExercise" ADD CONSTRAINT "WorkoutSessionExercise_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutSessionExerciseId_fkey" FOREIGN KEY ("workoutSessionExerciseId") REFERENCES "WorkoutSessionExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
