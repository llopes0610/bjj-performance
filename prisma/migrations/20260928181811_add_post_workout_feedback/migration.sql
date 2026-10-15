-- CreateEnum
CREATE TYPE "PostWorkoutFeeling" AS ENUM ('VERY_GOOD', 'GOOD', 'NORMAL', 'TIRED', 'VERY_TIRED');

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "hasPain" BOOLEAN,
ADD COLUMN     "painIntensity" INTEGER,
ADD COLUMN     "painNotes" TEXT,
ADD COLUMN     "painRegion" TEXT,
ADD COLUMN     "postWorkoutFeeling" "PostWorkoutFeeling";
