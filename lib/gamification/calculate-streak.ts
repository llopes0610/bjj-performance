export interface WeeklyStreakInput {
  currentStreak: number;
  longestStreak: number;

  currentProgramId: string;
  completedWeek: number;

  lastCompletedProgramId:
    | string
    | null;

  lastCompletedWeek:
    | number
    | null;

  /**
   * Informado pela camada que conhece
   * TrainingProgram.
   *
   * true somente quando a última semana
   * registrada foi a semana final do
   * programa anterior.
   */
  previousProgramCompleted?: boolean;
}

export interface WeeklyStreakResult {
  currentStreak: number;
  longestStreak: number;

  lastCompletedProgramId: string;
  lastCompletedWeek: number;

  changed: boolean;

  action:
    | "STARTED"
    | "INCREMENTED"
    | "ALREADY_PROCESSED"
    | "RESET";
}

export function calculateWeeklyStreak({
  currentStreak,
  longestStreak,
  currentProgramId,
  completedWeek,
  lastCompletedProgramId,
  lastCompletedWeek,
  previousProgramCompleted = false,
}: WeeklyStreakInput): WeeklyStreakResult {
  const safeCurrentStreak =
    Math.max(
      0,
      Math.floor(currentStreak)
    );

  const safeLongestStreak =
    Math.max(
      safeCurrentStreak,
      Math.floor(longestStreak)
    );

  const safeCompletedWeek =
    Math.max(
      1,
      Math.floor(completedWeek)
    );

  /*
   * Primeira semana completa registrada
   * para o atleta.
   */
  if (
    !lastCompletedProgramId ||
    lastCompletedWeek === null
  ) {
    return {
      currentStreak: 1,

      longestStreak: Math.max(
        safeLongestStreak,
        1
      ),

      lastCompletedProgramId:
        currentProgramId,

      lastCompletedWeek:
        safeCompletedWeek,

      changed: true,

      action: "STARTED",
    };
  }

  /*
   * A mesma semana (ou uma semana anterior)
   * já foi processada.
   *
   * Isso torna o cálculo idempotente antes
   * mesmo da proteção adicional do banco.
   *
   * Um retry atrasado de semana antiga
   * nunca reduz o streak.
   */
  if (
    lastCompletedProgramId ===
      currentProgramId &&
    safeCompletedWeek <=
      lastCompletedWeek
  ) {
    return {
      currentStreak:
        safeCurrentStreak,

      longestStreak:
        safeLongestStreak,

      lastCompletedProgramId,

      lastCompletedWeek,

      changed: false,

      action:
        "ALREADY_PROCESSED",
    };
  }

  /*
   * Semana imediatamente seguinte dentro
   * do mesmo programa.
   */
  if (
    lastCompletedProgramId ===
      currentProgramId &&
    safeCompletedWeek ===
      lastCompletedWeek + 1
  ) {
    const nextStreak =
      safeCurrentStreak + 1;

    return {
      currentStreak:
        nextStreak,

      longestStreak:
        Math.max(
          safeLongestStreak,
          nextStreak
        ),

      lastCompletedProgramId:
        currentProgramId,

      lastCompletedWeek:
        safeCompletedWeek,

      changed: true,

      action: "INCREMENTED",
    };
  }

  /*
   * Qualquer quebra de sequência dentro
   * do mesmo programa reinicia o streak.
   *
   * Exemplo:
   *
   * última semana = 2
   * nova semana = 4
   *
   * A semana 3 não foi registrada como
   * concluída.
   */
  if (
    lastCompletedProgramId ===
      currentProgramId
  ) {
    return {
      currentStreak: 1,

      longestStreak:
        safeLongestStreak,

      lastCompletedProgramId:
        currentProgramId,

      lastCompletedWeek:
        safeCompletedWeek,

      changed: true,

      action: "RESET",
    };
  }

  /*
   * Mudança de programa.
   *
   * A engine isolada não possui contexto
   * suficiente para afirmar que o programa
   * anterior terminou corretamente.
   *
   * A continuidade só é autorizada quando a
   * camada de integração confirma que a
   * semana final do programa anterior foi
   * concluída e esta é a semana 1 do novo
   * programa.
   */
  if (
    previousProgramCompleted &&
    safeCompletedWeek === 1
  ) {
    const nextStreak =
      safeCurrentStreak + 1;

    return {
      currentStreak:
        nextStreak,

      longestStreak:
        Math.max(
          safeLongestStreak,
          nextStreak
        ),

      lastCompletedProgramId:
        currentProgramId,

      lastCompletedWeek:
        safeCompletedWeek,

      changed: true,

      action: "INCREMENTED",
    };
  }

  /*
   * Caso contrário, por segurança, inicia
   * uma nova sequência.
   */
  return {
    currentStreak: 1,

    longestStreak:
      safeLongestStreak,

    lastCompletedProgramId:
      currentProgramId,

    lastCompletedWeek:
      safeCompletedWeek,

    changed: true,

    action: "RESET",
  };
}