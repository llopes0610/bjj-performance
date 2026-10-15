-- CreateEnum
CREATE TYPE "SessionRecoveryStatus" AS ENUM ('READY', 'CAUTION', 'FATIGUED', 'PAIN_ALERT');

-- AlterTable
ALTER TABLE "WorkoutExercisePrescription" ADD COLUMN     "progressionReason" TEXT,
ADD COLUMN     "safetyStatus" "SessionRecoveryStatus";
