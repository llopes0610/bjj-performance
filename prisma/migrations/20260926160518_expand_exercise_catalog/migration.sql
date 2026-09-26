/*
  Warnings:

  - The values [ACTIVATION,WARMUP] on the enum `ExerciseCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [UNILATERAL,ISOMETRIC,LOCOMOTION,OTHER] on the enum `MovementPattern` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `active` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `commonMistakes` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `muscles` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `safetyNotes` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `videoDurationSeconds` on the `Exercise` table. All the data in the column will be lost.
  - The `equipment` column on the `Exercise` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `difficulty` column on the `Exercise` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `primaryRegion` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExerciseDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "BodyRegion" AS ENUM ('FULL_BODY', 'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'CALVES', 'HIP', 'NECK');

-- CreateEnum
CREATE TYPE "ExerciseEquipment" AS ENUM ('MACHINE', 'CABLE', 'DUMBBELL', 'BARBELL', 'SMITH_MACHINE', 'KETTLEBELL', 'BODYWEIGHT', 'PLATE', 'BENCH', 'PULLUP_BAR', 'TOWEL', 'BIKE', 'TREADMILL');

-- AlterEnum
BEGIN;
CREATE TYPE "ExerciseCategory_new" AS ENUM ('STRENGTH', 'POWER', 'HYPERTROPHY', 'CORE', 'GRIP', 'CONDITIONING', 'MOBILITY', 'PREHAB');
ALTER TABLE "Exercise" ALTER COLUMN "category" TYPE "ExerciseCategory_new" USING ("category"::text::"ExerciseCategory_new");
ALTER TYPE "ExerciseCategory" RENAME TO "ExerciseCategory_old";
ALTER TYPE "ExerciseCategory_new" RENAME TO "ExerciseCategory";
DROP TYPE "public"."ExerciseCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MovementPattern_new" AS ENUM ('SQUAT', 'HINGE', 'LUNGE', 'HORIZONTAL_PUSH', 'VERTICAL_PUSH', 'HORIZONTAL_PULL', 'VERTICAL_PULL', 'CARRY', 'ROTATION', 'ANTI_ROTATION', 'ANTI_EXTENSION', 'ANTI_LATERAL_FLEXION', 'HIP_EXTENSION', 'GRIP', 'NECK', 'CONDITIONING', 'MOBILITY');
ALTER TABLE "Exercise" ALTER COLUMN "movement" TYPE "MovementPattern_new" USING ("movement"::text::"MovementPattern_new");
ALTER TYPE "MovementPattern" RENAME TO "MovementPattern_old";
ALTER TYPE "MovementPattern_new" RENAME TO "MovementPattern";
DROP TYPE "public"."MovementPattern_old";
COMMIT;

-- DropIndex
DROP INDEX "Exercise_name_key";

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "active",
DROP COLUMN "commonMistakes",
DROP COLUMN "muscles",
DROP COLUMN "safetyNotes",
DROP COLUMN "videoDurationSeconds",
ADD COLUMN     "avoidForPainRegions" "BodyRegion"[],
ADD COLUMN     "commonErrors" TEXT[],
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "primaryRegion" "BodyRegion" NOT NULL,
ADD COLUMN     "secondaryRegions" "BodyRegion"[],
DROP COLUMN "equipment",
ADD COLUMN     "equipment" "ExerciseEquipment"[],
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "ExerciseDifficulty" NOT NULL DEFAULT 'BEGINNER',
ALTER COLUMN "bjjTransfer" DROP NOT NULL,
ALTER COLUMN "bjjTransfer" SET DATA TYPE TEXT;
