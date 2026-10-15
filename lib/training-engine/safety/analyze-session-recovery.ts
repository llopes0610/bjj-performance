export type PostWorkoutFeeling =
  | "VERY_GOOD"
  | "GOOD"
  | "NORMAL"
  | "TIRED"
  | "VERY_TIRED";

export type SessionRecoveryStatus =
  | "READY"
  | "CAUTION"
  | "FATIGUED"
  | "PAIN_ALERT";

export type ProgressionPermission =
  | "ALLOW"
  | "HOLD"
  | "REGRESS";

export interface SessionRecoveryInput {
  sessionRpe: number | null;

  postWorkoutFeeling:
    | PostWorkoutFeeling
    | null;

  hasPain: boolean | null;

  painRegion?: string | null;

  painIntensity?: number | null;
}

export interface SessionRecoveryAnalysis {
  status: SessionRecoveryStatus;

  progressionPermission:
    ProgressionPermission;

  fatigueScore: number;

  shouldReduceVolume: boolean;

  shouldBlockProgression: boolean;

  shouldConsiderExerciseSubstitution: boolean;

  reasons: string[];
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

export function analyzeSessionRecovery({
  sessionRpe,
  postWorkoutFeeling,
  hasPain,
  painRegion,
  painIntensity,
}: SessionRecoveryInput): SessionRecoveryAnalysis {
  const reasons: string[] = [];

  /*
   * SCORE DE FADIGA
   *
   * 0 = baixa
   * 10 = muito alta
   *
   * Não é diagnóstico.
   * É somente um indicador interno
   * para controle da prescrição.
   */
  let fatigueScore = 0;

  /*
   * SESSION RPE
   */
  if (
    sessionRpe !== null &&
    sessionRpe !== undefined
  ) {
    fatigueScore +=
      sessionRpe * 0.6;

    if (sessionRpe >= 9) {
      reasons.push(
        "O esforço geral do treino foi muito alto."
      );
    } else if (
      sessionRpe >= 8
    ) {
      reasons.push(
        "O esforço geral do treino ficou elevado."
      );
    }
  }

  /*
   * SENSAÇÃO PÓS-TREINO
   */
  switch (
    postWorkoutFeeling
  ) {
    case "VERY_GOOD":
      fatigueScore -= 1;
      break;

    case "GOOD":
      fatigueScore -= 0.5;
      break;

    case "NORMAL":
      break;

    case "TIRED":
      fatigueScore += 1.5;

      reasons.push(
        "O atleta relatou cansaço após o treino."
      );

      break;

    case "VERY_TIRED":
      fatigueScore += 3;

      reasons.push(
        "O atleta relatou cansaço muito elevado após o treino."
      );

      break;

    default:
      break;
  }

  fatigueScore = clamp(
    fatigueScore,
    0,
    10
  );

  /*
   * DOR
   *
   * Dor possui prioridade sobre
   * a classificação de fadiga.
   */
  if (hasPain) {
    const normalizedPainIntensity =
      painIntensity ?? 0;

    const region =
      painRegion?.trim();

    if (
      normalizedPainIntensity >= 7
    ) {
      reasons.push(
        region
          ? `Foi relatada dor de alta intensidade em ${region}.`
          : "Foi relatada dor de alta intensidade."
      );

      return {
        status: "PAIN_ALERT",

        progressionPermission:
          "REGRESS",

        fatigueScore,

        shouldReduceVolume: true,

        shouldBlockProgression: true,

        shouldConsiderExerciseSubstitution:
          true,

        reasons,
      };
    }

    if (
      normalizedPainIntensity >= 4
    ) {
      reasons.push(
        region
          ? `Foi relatada dor moderada em ${region}.`
          : "Foi relatada dor moderada."
      );

      return {
        status: "PAIN_ALERT",

        progressionPermission:
          "HOLD",

        fatigueScore,

        shouldReduceVolume: false,

        shouldBlockProgression: true,

        shouldConsiderExerciseSubstitution:
          true,

        reasons,
      };
    }

    reasons.push(
      region
        ? `Foi relatado desconforto leve em ${region}.`
        : "Foi relatado desconforto leve."
    );

    return {
      status: "CAUTION",

      progressionPermission:
        "HOLD",

      fatigueScore,

      shouldReduceVolume: false,

      shouldBlockProgression: true,

      shouldConsiderExerciseSubstitution:
        false,

      reasons,
    };
  }

  /*
   * FADIGA ALTA
   */
  if (
    fatigueScore >= 8
  ) {
    reasons.push(
      "Os indicadores pós-treino sugerem fadiga elevada."
    );

    return {
      status: "FATIGUED",

      progressionPermission:
        "REGRESS",

      fatigueScore,

      shouldReduceVolume: true,

      shouldBlockProgression: true,

      shouldConsiderExerciseSubstitution:
        false,

      reasons,
    };
  }

  /*
   * CAUTELA
   */
  if (
    fatigueScore >= 6.5
  ) {
    reasons.push(
      "Os indicadores pós-treino sugerem recuperação incompleta."
    );

    return {
      status: "CAUTION",

      progressionPermission:
        "HOLD",

      fatigueScore,

      shouldReduceVolume: false,

      shouldBlockProgression: true,

      shouldConsiderExerciseSubstitution:
        false,

      reasons,
    };
  }

  /*
   * RECUPERAÇÃO NORMAL
   */
  if (
    reasons.length === 0
  ) {
    reasons.push(
      "Os indicadores pós-treino estão dentro da faixa esperada."
    );
  }

  return {
    status: "READY",

    progressionPermission:
      "ALLOW",

    fatigueScore,

    shouldReduceVolume: false,

    shouldBlockProgression: false,

    shouldConsiderExerciseSubstitution:
      false,

    reasons,
  };
}