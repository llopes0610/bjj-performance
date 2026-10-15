export type ExerciseExecutionType =
  | "REPS"
  | "TIME"
  | "DISTANCE";

interface ExecutionPrescription {
  repsMin?: number | null;
  repsMax?: number | null;

  durationSeconds?: number | null;

  distanceMeters?: number | null;
}

export function getExecutionType({
  repsMin,
  repsMax,
  durationSeconds,
  distanceMeters,
}: ExecutionPrescription): ExerciseExecutionType {
  if (
    distanceMeters !== null &&
    distanceMeters !== undefined
  ) {
    return "DISTANCE";
  }

  if (
    durationSeconds !== null &&
    durationSeconds !== undefined
  ) {
    return "TIME";
  }

  if (
    repsMin !== null &&
    repsMin !== undefined &&
    repsMax !== null &&
    repsMax !== undefined
  ) {
    return "REPS";
  }

  /*
   * Fallback seguro para exercícios
   * antigos que ainda não tenham uma
   * prescrição especializada.
   */
  return "REPS";
}