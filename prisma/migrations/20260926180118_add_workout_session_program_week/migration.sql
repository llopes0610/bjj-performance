-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "programWeek" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "WorkoutSession_athleteId_programWeek_idx" ON "WorkoutSession"("athleteId", "programWeek");
