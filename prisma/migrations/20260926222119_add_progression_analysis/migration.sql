-- CreateEnum
CREATE TYPE "ProgressionDecision" AS ENUM ('PROGRESS', 'MAINTAIN', 'REGRESS', 'NO_DATA');

-- AlterTable
ALTER TABLE "WorkoutExercisePrescription" ADD COLUMN     "previousAverageReps" DOUBLE PRECISION,
ADD COLUMN     "previousAverageRpe" DOUBLE PRECISION,
ADD COLUMN     "previousAverageWeightKg" DOUBLE PRECISION,
ADD COLUMN     "progressionDecision" "ProgressionDecision" NOT NULL DEFAULT 'NO_DATA';
