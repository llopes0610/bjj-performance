-- CreateTable
CREATE TABLE "WorkoutExercisePrescription" (
    "id" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "programWeek" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "repsMin" INTEGER,
    "repsMax" INTEGER,
    "durationSeconds" INTEGER,
    "distanceMeters" INTEGER,
    "restSeconds" INTEGER NOT NULL,
    "targetRpe" DOUBLE PRECISION,
    "suggestedWeightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutExercisePrescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkoutExercisePrescription_programWeek_idx" ON "WorkoutExercisePrescription"("programWeek");

-- CreateIndex
CREATE INDEX "WorkoutExercisePrescription_workoutExerciseId_idx" ON "WorkoutExercisePrescription"("workoutExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExercisePrescription_workoutExerciseId_programWeek_key" ON "WorkoutExercisePrescription"("workoutExerciseId", "programWeek");

-- AddForeignKey
ALTER TABLE "WorkoutExercisePrescription" ADD CONSTRAINT "WorkoutExercisePrescription_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
