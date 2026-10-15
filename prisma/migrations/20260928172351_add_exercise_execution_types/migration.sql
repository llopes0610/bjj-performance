-- CreateEnum
CREATE TYPE "ExerciseExecutionType" AS ENUM ('REPS', 'TIME', 'DISTANCE');

-- AlterTable
ALTER TABLE "WorkoutExercise" ADD COLUMN     "executionType" "ExerciseExecutionType" NOT NULL DEFAULT 'REPS';

-- AlterTable
ALTER TABLE "WorkoutExercisePrescription" ADD COLUMN     "executionType" "ExerciseExecutionType" NOT NULL DEFAULT 'REPS';

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "distanceMeters" DOUBLE PRECISION,
ADD COLUMN     "durationSeconds" INTEGER;
