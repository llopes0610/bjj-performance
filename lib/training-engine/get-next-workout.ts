interface WorkoutSessionLike {
  status:
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
}

interface WorkoutLike {
  id: string;
  order: number;

  sessions: WorkoutSessionLike[];
}

export function getNextWorkout<
  T extends WorkoutLike,
>(
  workouts: T[]
): T | null {
  if (workouts.length === 0) {
    return null;
  }

  const orderedWorkouts = [...workouts].sort(
    (a, b) => a.order - b.order
  );

  /*
   * Primeiro procuramos uma sessão aberta.
   *
   * Se o atleta saiu do aplicativo no meio
   * do treino, ele deve continuar de onde parou.
   */
  const workoutInProgress =
    orderedWorkouts.find((workout) =>
      workout.sessions.some(
        (session) =>
          session.status === "IN_PROGRESS"
      )
    );

  if (workoutInProgress) {
    return workoutInProgress;
  }

  /*
   * Depois procuramos o primeiro treino
   * que ainda não possui uma sessão concluída.
   *
   * Exemplo:
   *
   * A = COMPLETED
   * B = nenhuma sessão
   * C = nenhuma sessão
   *
   * resultado = B
   */
  const nextWorkout =
    orderedWorkouts.find(
      (workout) =>
        !workout.sessions.some(
          (session) =>
            session.status === "COMPLETED"
        )
    );

  if (nextWorkout) {
    return nextWorkout;
  }

  /*
   * Todos A/B/C já foram concluídos.
   *
   * A progressão de semana será tratada
   * na próxima etapa.
   */
  return null;
}