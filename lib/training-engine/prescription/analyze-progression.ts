export type ProgressionDecision =
  | "PROGRESS"
  | "MAINTAIN"
  | "REGRESS"
  | "NO_DATA";

export type ExerciseExecutionType =
  | "REPS"
  | "TIME"
  | "DISTANCE";

interface CompletedSet {
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;

  durationSeconds?: number | null;
  distanceMeters?: number | null;
}

interface AnalyzeProgressionParams {
  executionType: ExerciseExecutionType;

  sets: CompletedSet[];

  prescribedRepsMin: number | null;
  prescribedRepsMax: number | null;

  prescribedDurationSeconds: number | null;
  prescribedDistanceMeters: number | null;

  targetRpe: number | null;
}

export interface ProgressionAnalysis {
  decision: ProgressionDecision;

  averageWeightKg: number | null;
  averageReps: number | null;
  averageRpe: number | null;

  averageDurationSeconds: number | null;
  averageDistanceMeters: number | null;

  suggestedWeightKg: number | null;

  suggestedDurationSeconds: number | null;
  suggestedDistanceMeters: number | null;

  reason: string;
}

function average(
  values: number[]
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0
    ) / values.length
  );
}

function roundToHalfKg(
  value: number
) {
  return (
    Math.round(value * 2) /
    2
  );
}

function getAverageWeight(
  sets: CompletedSet[]
) {
  return average(
    sets
      .map(
        (set) =>
          set.weightKg
      )
      .filter(
        (value): value is number =>
          value !== null &&
          value !== undefined &&
          value > 0
      )
  );
}

function getAverageRpe(
  sets: CompletedSet[]
) {
  return average(
    sets
      .map(
        (set) => set.rpe
      )
      .filter(
        (value): value is number =>
          value !== null &&
          value !== undefined
      )
  );
}

export function analyzeProgression({
  executionType,
  sets,
  prescribedRepsMin,
  prescribedRepsMax,
  prescribedDurationSeconds,
  prescribedDistanceMeters,
  targetRpe,
}: AnalyzeProgressionParams): ProgressionAnalysis {
  const completedSets =
    sets.filter(
      (set) =>
        set.rpe !== null &&
        set.rpe !== undefined
    );

  const averageWeightKg =
    getAverageWeight(
      completedSets
    );

  const averageRpe =
    getAverageRpe(
      completedSets
    );

  const emptyResult = (
    reason: string
  ): ProgressionAnalysis => ({
    decision: "NO_DATA",

    averageWeightKg,
    averageReps: null,
    averageRpe,

    averageDurationSeconds:
      null,

    averageDistanceMeters:
      null,

    suggestedWeightKg:
      null,

    suggestedDurationSeconds:
      null,

    suggestedDistanceMeters:
      null,

    reason,
  });

  if (
    completedSets.length === 0 ||
    averageRpe === null
  ) {
    return emptyResult(
      "Não existem séries concluídas suficientes para analisar a progressão."
    );
  }

  /*
   * =====================================
   * REPS
   * =====================================
   */
  if (
    executionType === "REPS"
  ) {
    const validSets =
      completedSets.filter(
        (set) =>
          set.reps !== null &&
          set.reps !== undefined
      );

    if (
      validSets.length === 0
    ) {
      return emptyResult(
        "Não existem repetições registradas suficientes para analisar a progressão."
      );
    }

    const averageReps =
      average(
        validSets.map(
          (set) =>
            set.reps as number
        )
      );

    if (
      averageReps === null ||
      prescribedRepsMin ===
        null ||
      prescribedRepsMax ===
        null
    ) {
      return {
        ...emptyResult(
          "A prescrição de repetições está incompleta."
        ),

        averageReps,
      };
    }

    const rpeTooHigh =
      targetRpe !== null &&
      averageRpe >
        targetRpe + 1;

    const repsTooLow =
      averageReps <
      prescribedRepsMin;

    if (
      rpeTooHigh ||
      repsTooLow
    ) {
      return {
        decision: "REGRESS",

        averageWeightKg,
        averageReps,
        averageRpe,

        averageDurationSeconds:
          null,

        averageDistanceMeters:
          null,

        suggestedWeightKg:
          averageWeightKg !==
          null
            ? roundToHalfKg(
                averageWeightKg *
                  0.95
              )
            : null,

        suggestedDurationSeconds:
          null,

        suggestedDistanceMeters:
          null,

        reason:
          "A execução ficou acima do esforço planejado ou abaixo da faixa mínima de repetições.",
      };
    }

    const allSetsReachedTop =
      validSets.every(
        (set) =>
          (set.reps ??
            0) >=
          prescribedRepsMax
      );

    const rpeControlled =
      targetRpe === null ||
      averageRpe <=
        targetRpe;

    if (
      allSetsReachedTop &&
      rpeControlled
    ) {
      return {
        decision: "PROGRESS",

        averageWeightKg,
        averageReps,
        averageRpe,

        averageDurationSeconds:
          null,

        averageDistanceMeters:
          null,

        suggestedWeightKg:
          averageWeightKg !==
          null
            ? roundToHalfKg(
                averageWeightKg *
                  1.025
              )
            : null,

        suggestedDurationSeconds:
          null,

        suggestedDistanceMeters:
          null,

        reason:
          "Todas as séries atingiram o topo da faixa com RPE controlado.",
      };
    }

    return {
      decision: "MAINTAIN",

      averageWeightKg,
      averageReps,
      averageRpe,

      averageDurationSeconds:
        null,

      averageDistanceMeters:
        null,

      suggestedWeightKg:
        averageWeightKg,

      suggestedDurationSeconds:
        null,

      suggestedDistanceMeters:
        null,

      reason:
        "A execução ficou dentro da faixa planejada. Mantenha a carga e consolide o desempenho.",
    };
  }

  /*
   * =====================================
   * TIME
   * =====================================
   */
  if (
    executionType === "TIME"
  ) {
    const validSets =
      completedSets.filter(
        (set) =>
          set.durationSeconds !==
            null &&
          set.durationSeconds !==
            undefined
      );

    if (
      validSets.length === 0
    ) {
      return emptyResult(
        "Não existem tempos registrados suficientes para analisar a progressão."
      );
    }

    const averageDurationSeconds =
      average(
        validSets.map(
          (set) =>
            set.durationSeconds as number
        )
      );

    if (
      averageDurationSeconds ===
        null ||
      prescribedDurationSeconds ===
        null
    ) {
      return {
        ...emptyResult(
          "A prescrição de tempo está incompleta."
        ),

        averageDurationSeconds,
      };
    }

    const rpeTooHigh =
      targetRpe !== null &&
      averageRpe >
        targetRpe + 1;

    const belowTarget =
      averageDurationSeconds <
      prescribedDurationSeconds *
        0.9;

    if (
      rpeTooHigh ||
      belowTarget
    ) {
      return {
        decision: "REGRESS",

        averageWeightKg,
        averageReps: null,
        averageRpe,

        averageDurationSeconds,

        averageDistanceMeters:
          null,

        suggestedWeightKg:
          averageWeightKg,

        suggestedDurationSeconds:
          Math.max(
            5,
            Math.round(
              prescribedDurationSeconds *
                0.9
            )
          ),

        suggestedDistanceMeters:
          null,

        reason:
          "O tempo executado ou o RPE indica necessidade de reduzir a exigência.",
      };
    }

    const reachedTarget =
      validSets.every(
        (set) =>
          (set.durationSeconds ??
            0) >=
          prescribedDurationSeconds
      );

    const rpeControlled =
      targetRpe === null ||
      averageRpe <=
        targetRpe;

    if (
      reachedTarget &&
      rpeControlled
    ) {
      return {
        decision: "PROGRESS",

        averageWeightKg,
        averageReps: null,
        averageRpe,

        averageDurationSeconds,

        averageDistanceMeters:
          null,

        suggestedWeightKg:
          averageWeightKg,

        /*
         * Progressão conservadora:
         * +5 segundos.
         */
        suggestedDurationSeconds:
          prescribedDurationSeconds +
          5,

        suggestedDistanceMeters:
          null,

        reason:
          "Todas as séries atingiram o tempo prescrito com RPE controlado.",
      };
    }

    return {
      decision: "MAINTAIN",

      averageWeightKg,
      averageReps: null,
      averageRpe,

      averageDurationSeconds,

      averageDistanceMeters:
        null,

      suggestedWeightKg:
        averageWeightKg,

      suggestedDurationSeconds:
        prescribedDurationSeconds,

      suggestedDistanceMeters:
        null,

      reason:
        "O tempo foi cumprido, mas ainda deve ser consolidado antes de progredir.",
    };
  }

  /*
   * =====================================
   * DISTANCE
   * =====================================
   */
  const validSets =
    completedSets.filter(
      (set) =>
        set.distanceMeters !==
          null &&
        set.distanceMeters !==
          undefined
    );

  if (
    validSets.length === 0
  ) {
    return emptyResult(
      "Não existem distâncias registradas suficientes para analisar a progressão."
    );
  }

  const averageDistanceMeters =
    average(
      validSets.map(
        (set) =>
          set.distanceMeters as number
      )
    );

  if (
    averageDistanceMeters ===
      null ||
    prescribedDistanceMeters ===
      null
  ) {
    return {
      ...emptyResult(
        "A prescrição de distância está incompleta."
      ),

      averageDistanceMeters,
    };
  }

  const rpeTooHigh =
    targetRpe !== null &&
    averageRpe >
      targetRpe + 1;

  const belowTarget =
    averageDistanceMeters <
    prescribedDistanceMeters *
      0.9;

  if (
    rpeTooHigh ||
    belowTarget
  ) {
    return {
      decision: "REGRESS",

      averageWeightKg,
      averageReps: null,
      averageRpe,

      averageDurationSeconds:
        null,

      averageDistanceMeters,

      suggestedWeightKg:
        averageWeightKg !== null
          ? roundToHalfKg(
              averageWeightKg *
                0.95
            )
          : null,

      suggestedDurationSeconds:
        null,

      suggestedDistanceMeters:
        prescribedDistanceMeters,

      reason:
        "A distância executada ou o RPE indica necessidade de reduzir a carga.",
    };
  }

  const reachedDistance =
    validSets.every(
      (set) =>
        (set.distanceMeters ??
          0) >=
        prescribedDistanceMeters
    );

  const rpeControlled =
    targetRpe === null ||
    averageRpe <= targetRpe;

  if (
    reachedDistance &&
    rpeControlled
  ) {
    return {
      decision: "PROGRESS",

      averageWeightKg,
      averageReps: null,
      averageRpe,

      averageDurationSeconds:
        null,

      averageDistanceMeters,

      /*
       * No Farmer's Walk mantemos
       * a distância e aumentamos carga.
       */
      suggestedWeightKg:
        averageWeightKg !== null
          ? roundToHalfKg(
              averageWeightKg *
                1.025
            )
          : null,

      suggestedDurationSeconds:
        null,

      suggestedDistanceMeters:
        prescribedDistanceMeters,

      reason:
        "Todas as séries atingiram a distância prescrita com RPE controlado.",
    };
  }

  return {
    decision: "MAINTAIN",

    averageWeightKg,
    averageReps: null,
    averageRpe,

    averageDurationSeconds:
      null,

    averageDistanceMeters,

    suggestedWeightKg:
      averageWeightKg,

    suggestedDurationSeconds:
      null,

    suggestedDistanceMeters:
      prescribedDistanceMeters,

    reason:
      "A distância foi cumprida, mas o desempenho ainda deve ser consolidado.",
  };
}