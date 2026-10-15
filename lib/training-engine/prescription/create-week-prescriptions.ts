import { prisma } from "@/lib/prisma";

import { analyzeProgression } from "@/lib/training-engine/prescription/analyze-progression";
import { getExecutionType } from "@/lib/training-engine/get-execution-type";
import {
  analyzeSessionRecovery,
  type SessionRecoveryAnalysis,
} from "@/lib/training-engine/safety/analyze-session-recovery";

interface CreateWeekPrescriptionsParams {
  programId: string;
  programWeek: number;
}

type ProgressionDecision =
  | "PROGRESS"
  | "MAINTAIN"
  | "REGRESS"
  | "NO_DATA";

interface SafetyAdjustedProgression {
  decision: ProgressionDecision;

  suggestedWeightKg: number | null;

  suggestedDurationSeconds:
    | number
    | null;

  suggestedDistanceMeters:
    | number
    | null;
}

/*
 * ============================================================
 * SAFETY OVERRIDE
 * ============================================================
 *
 * O motor de performance determina
 * inicialmente o que o exercício
 * permitiria fazer.
 *
 * O Safety Engine pode:
 *
 * - permitir;
 * - bloquear;
 * - reduzir.
 *
 * Ele nunca pode promover uma decisão.
 *
 * PROGRESS + ALLOW   -> PROGRESS
 * PROGRESS + HOLD    -> MAINTAIN
 * PROGRESS + REGRESS -> REGRESS
 *
 * MAINTAIN + ALLOW   -> MAINTAIN
 * MAINTAIN + HOLD    -> MAINTAIN
 * MAINTAIN + REGRESS -> REGRESS
 *
 * REGRESS permanece REGRESS.
 */
function applySafetyToProgression({
  exerciseDecision,
  suggestedWeightKg,
  suggestedDurationSeconds,
  suggestedDistanceMeters,
  previousWeightKg,
  previousDurationSeconds,
  previousDistanceMeters,
  safety,
}: {
  exerciseDecision: ProgressionDecision;

  suggestedWeightKg:
    | number
    | null;

  suggestedDurationSeconds:
    | number
    | null;

  suggestedDistanceMeters:
    | number
    | null;

  previousWeightKg:
    | number
    | null;

  previousDurationSeconds:
    | number
    | null;

  previousDistanceMeters:
    | number
    | null;

  safety:
    | SessionRecoveryAnalysis
    | null;
}): SafetyAdjustedProgression {
  /*
   * Sem feedback válido da sessão,
   * mantemos exclusivamente a decisão
   * do motor de performance.
   */
  if (!safety) {
    return {
      decision:
        exerciseDecision,

      suggestedWeightKg,

      suggestedDurationSeconds,

      suggestedDistanceMeters,
    };
  }

  /*
   * ALLOW
   *
   * Nenhuma intervenção necessária.
   */
  if (
    safety.progressionPermission ===
    "ALLOW"
  ) {
    return {
      decision:
        exerciseDecision,

      suggestedWeightKg,

      suggestedDurationSeconds,

      suggestedDistanceMeters,
    };
  }

  /*
   * HOLD
   *
   * O Safety Engine impede uma
   * progressão.
   *
   * Uma regressão já determinada pelo
   * exercício continua sendo respeitada.
   */
  if (
    safety.progressionPermission ===
    "HOLD"
  ) {
    if (
      exerciseDecision ===
      "REGRESS"
    ) {
      return {
        decision:
          "REGRESS",

        suggestedWeightKg,

        suggestedDurationSeconds,

        suggestedDistanceMeters,
      };
    }

    /*
     * Sem dados suficientes do exercício,
     * preservamos NO_DATA.
     */
    if (
      exerciseDecision ===
      "NO_DATA"
    ) {
      return {
        decision:
          "NO_DATA",

        suggestedWeightKg,

        suggestedDurationSeconds,

        suggestedDistanceMeters,
      };
    }

    /*
     * PROGRESS ou MAINTAIN passam a
     * utilizar os valores anteriores.
     */
    return {
      decision:
        "MAINTAIN",

      suggestedWeightKg:
        previousWeightKg,

      suggestedDurationSeconds:
        previousDurationSeconds,

      suggestedDistanceMeters:
        previousDistanceMeters,
    };
  }

  /*
   * REGRESS
   *
   * Se o próprio exercício já havia
   * determinado regressão, mantemos
   * exatamente a regressão calculada.
   */
  if (
    exerciseDecision ===
    "REGRESS"
  ) {
    return {
      decision:
        "REGRESS",

      suggestedWeightKg,

      suggestedDurationSeconds,

      suggestedDistanceMeters,
    };
  }

  /*
   * Caso contrário aplicamos uma
   * regressão conservadora.
   *
   * CARGA:
   * -5%
   *
   * TIME:
   * -5 segundos
   *
   * DISTANCE:
   * mantém distância e reduz carga,
   * quando houver carga.
   */
  const regressedWeightKg =
    previousWeightKg !== null
      ? roundToHalf(
          previousWeightKg *
            0.95
        )
      : null;

  const regressedDurationSeconds =
    previousDurationSeconds !==
    null
      ? Math.max(
          5,
          previousDurationSeconds -
            5
        )
      : null;

  return {
    decision:
      "REGRESS",

    suggestedWeightKg:
      regressedWeightKg,

    suggestedDurationSeconds:
      regressedDurationSeconds,

    suggestedDistanceMeters:
      previousDistanceMeters,
  };
}

/*
 * ============================================================
 * EXPLICAÇÃO DA DECISÃO
 * ============================================================
 *
 * Gera uma explicação persistente e
 * legível da decisão tomada.
 *
 * Importante:
 *
 * - descreve decisão de treinamento;
 * - não realiza diagnóstico;
 * - mantém performance e safety
 *   separados conceitualmente.
 */
function buildProgressionReason({
  exerciseDecision,
  finalDecision,
  performanceReason,
  safety,
}: {
  exerciseDecision:
    ProgressionDecision;

  finalDecision:
    ProgressionDecision;

  performanceReason:
    string;

  safety:
    | SessionRecoveryAnalysis
    | null;
}) {
  const parts: string[] = [];

  /*
   * Primeiro registramos a justificativa
   * fornecida pelo motor de performance.
   */
  if (
    performanceReason.trim()
      .length > 0
  ) {
    parts.push(
      `Performance: ${performanceReason}`
    );
  }

  /*
   * Não existe feedback de recuperação
   * disponível.
   */
  if (!safety) {
    parts.push(
      "Recuperação: não havia feedback pós-treino disponível para aplicar o Safety Engine."
    );

    return parts.join(" ");
  }

  /*
   * Registramos os motivos específicos
   * encontrados pelo Safety Engine.
   */
  if (
    safety.reasons.length > 0
  ) {
    parts.push(
      `Recuperação: ${safety.reasons.join(
        " "
      )}`
    );
  }

  /*
   * Explicamos explicitamente quando
   * Safety modificou a decisão original.
   */
  if (
    exerciseDecision ===
      "PROGRESS" &&
    finalDecision ===
      "MAINTAIN"
  ) {
    parts.push(
      "Decisão final: a performance permitiria progressão, mas a progressão foi mantida por segurança e recuperação."
    );
  } else if (
    exerciseDecision !==
      "REGRESS" &&
    finalDecision ===
      "REGRESS"
  ) {
    parts.push(
      "Decisão final: o Safety Engine determinou uma regressão conservadora para a próxima semana."
    );
  } else if (
    exerciseDecision ===
      finalDecision
  ) {
    parts.push(
      "Decisão final: o Safety Engine não tornou a prescrição mais agressiva do que a decisão baseada na performance."
    );
  } else {
    parts.push(
      "Decisão final: foi aplicada a opção mais conservadora entre performance e recuperação."
    );
  }

  return parts.join(" ");
}

/*
 * Mantém cargas em incrementos de
 * 0,5 kg.
 */
function roundToHalf(
  value: number
) {
  return (
    Math.round(value * 2) / 2
  );
}

/*
 * ============================================================
 * RECUPERAÇÃO DA SESSÃO
 * ============================================================
 *
 * Um exercício pode aparecer em mais
 * de uma sessão concluída.
 *
 * Utilizamos a sessão mais recente
 * daquele exercício na semana anterior.
 */
function getSessionRecoveryAnalysis(
  sessionExercises: Array<{
    workoutSession: {
      completedAt:
        | Date
        | null;

      startedAt:
        Date;

      sessionRpe:
        | number
        | null;

      postWorkoutFeeling:
        | "VERY_GOOD"
        | "GOOD"
        | "NORMAL"
        | "TIRED"
        | "VERY_TIRED"
        | null;

      hasPain:
        | boolean
        | null;

      painRegion:
        | string
        | null;

      painIntensity:
        | number
        | null;
    };
  }>
): SessionRecoveryAnalysis | null {
  if (
    sessionExercises.length ===
    0
  ) {
    return null;
  }

  const sortedSessions = [
    ...sessionExercises,
  ].sort((a, b) => {
    const dateA =
      a.workoutSession
        .completedAt ??
      a.workoutSession
        .startedAt;

    const dateB =
      b.workoutSession
        .completedAt ??
      b.workoutSession
        .startedAt;

    return (
      dateB.getTime() -
      dateA.getTime()
    );
  });

  const latestSession =
    sortedSessions[0]
      .workoutSession;

  /*
   * Sessões antigas podem ter sido
   * concluídas antes da implementação
   * do feedback pós-treino.
   */
  if (
    latestSession.sessionRpe ===
      null ||
    latestSession
      .postWorkoutFeeling ===
      null ||
    latestSession.hasPain ===
      null
  ) {
    return null;
  }

  return analyzeSessionRecovery({
    sessionRpe:
      latestSession.sessionRpe,

    postWorkoutFeeling:
      latestSession
        .postWorkoutFeeling,

    hasPain:
      latestSession.hasPain,

    painRegion:
      latestSession.painRegion,

    painIntensity:
      latestSession
        .painIntensity,
  });
}

export async function createWeekPrescriptions({
  programId,
  programWeek,
}: CreateWeekPrescriptionsParams) {
  if (programWeek < 1) {
    throw new Error(
      "A semana do programa deve ser maior ou igual a 1."
    );
  }

  const previousWeek =
    programWeek - 1;

  const program =
    await prisma.trainingProgram.findUnique(
      {
        where: {
          id: programId,
        },

        include: {
          workouts: {
            orderBy: {
              order:
                "asc",
            },

            include: {
              exercises: {
                orderBy: {
                  order:
                    "asc",
                },

                include: {
                  /*
                   * Prescrição atual +
                   * prescrição anterior.
                   */
                  weeklyPrescriptions:
                    {
                      where: {
                        programWeek:
                          {
                            in: [
                              programWeek,
                              previousWeek,
                            ],
                          },
                      },

                      orderBy: {
                        programWeek:
                          "asc",
                      },
                    },

                  /*
                   * Execuções concluídas da
                   * semana anterior.
                   */
                  sessionExercises:
                    {
                      where: {
                        workoutSession:
                          {
                            programWeek:
                              previousWeek,

                            status:
                              "COMPLETED",
                          },
                      },

                      include: {
                        sets: {
                          where: {
                            completed:
                              true,
                          },

                          orderBy:
                            {
                              setNumber:
                                "asc",
                            },
                        },

                        /*
                         * Necessário para
                         * feedback pós-treino.
                         */
                        workoutSession:
                          true,
                      },
                    },
                },
              },
            },
          },
        },
      }
    );

  if (!program) {
    throw new Error(
      "Programa de treinamento não encontrado."
    );
  }

  if (
    programWeek >
    program.durationWeeks
  ) {
    throw new Error(
      "A semana solicitada ultrapassa a duração do programa."
    );
  }

  const exercises =
    program.workouts.flatMap(
      (workout) =>
        workout.exercises
    );

  if (
    exercises.length === 0
  ) {
    throw new Error(
      "O programa não possui exercícios."
    );
  }

  /*
   * Descobre especificamente quais
   * exercícios ainda não possuem
   * prescrição para programWeek.
   */
  const missingPrescriptions =
    exercises.filter(
      (exercise) => {
        const currentPrescription =
          exercise.weeklyPrescriptions.find(
            (
              prescription
            ) =>
              prescription
                .programWeek ===
              programWeek
          );

        return (
          !currentPrescription
        );
      }
    );

  /*
   * Idempotência.
   */
  if (
    missingPrescriptions.length ===
    0
  ) {
    return {
      created: 0,
      alreadyExists: true,
    };
  }

  const prescriptions =
    missingPrescriptions.map(
      (exercise) => {
        const previousPrescription =
          exercise.weeklyPrescriptions.find(
            (
              prescription
            ) =>
              prescription
                .programWeek ===
              previousWeek
          );

        /*
         * ==================================
         * SEMANA 1
         * ==================================
         *
         * Ainda não existe histórico.
         */
        if (
          programWeek === 1
        ) {
          return {
            workoutExerciseId:
              exercise.id,

            programWeek,

            executionType:
              getExecutionType({
                repsMin:
                  exercise
                    .repsMin,

                repsMax:
                  exercise
                    .repsMax,

                durationSeconds:
                  exercise
                    .durationSeconds,

                distanceMeters:
                  exercise
                    .distanceMeters,
              }),

            sets:
              exercise.sets,

            repsMin:
              exercise.repsMin,

            repsMax:
              exercise.repsMax,

            durationSeconds:
              exercise
                .durationSeconds,

            distanceMeters:
              exercise
                .distanceMeters,

            restSeconds:
              exercise
                .restSeconds,

            targetRpe:
              exercise.targetRpe,

            suggestedWeightKg:
              null,

            progressionDecision:
              "NO_DATA" as const,

            /*
             * Não existe sessão anterior
             * para análise de safety.
             */
            safetyStatus:
              null,

            progressionReason:
              "Primeira semana do programa. Ainda não existe histórico suficiente para calcular progressão ou recuperação.",

            previousAverageWeightKg:
              null,

            previousAverageReps:
              null,

            previousAverageRpe:
              null,

            previousAverageDurationSeconds:
              null,

            previousAverageDistanceMeters:
              null,

            notes:
              exercise.notes,
          };
        }

        /*
         * ==================================
         * HISTÓRICO DA SEMANA ANTERIOR
         * ==================================
         */
        const previousSets =
          exercise.sessionExercises.flatMap(
            (
              sessionExercise
            ) =>
              sessionExercise.sets.map(
                (set) => ({
                  weightKg:
                    set.weightKg,

                  reps:
                    set.reps,

                  durationSeconds:
                    set.durationSeconds,

                  distanceMeters:
                    set.distanceMeters,

                  rpe:
                    set.rpe,
                })
              )
          );

        /*
         * ==================================
         * TIPO DE EXECUÇÃO
         * ==================================
         */
        const executionType =
          previousPrescription
            ?.executionType ??
          getExecutionType({
            repsMin:
              exercise.repsMin,

            repsMax:
              exercise.repsMax,

            durationSeconds:
              exercise
                .durationSeconds,

            distanceMeters:
              exercise
                .distanceMeters,
          });

        /*
         * ==================================
         * REFERÊNCIA DA SEMANA ANTERIOR
         * ==================================
         */
        const prescribedRepsMin =
          previousPrescription
            ?.repsMin ??
          exercise.repsMin;

        const prescribedRepsMax =
          previousPrescription
            ?.repsMax ??
          exercise.repsMax;

        const prescribedDurationSeconds =
          previousPrescription
            ?.durationSeconds ??
          exercise
            .durationSeconds;

        const prescribedDistanceMeters =
          previousPrescription
            ?.distanceMeters ??
          exercise
            .distanceMeters;

        const targetRpe =
          previousPrescription
            ?.targetRpe ??
          exercise.targetRpe;

        /*
         * ==================================
         * MOTOR DE PERFORMANCE
         * ==================================
         */
        const analysis =
          analyzeProgression({
            executionType,

            sets:
              previousSets,

            prescribedRepsMin,

            prescribedRepsMax,

            prescribedDurationSeconds,

            prescribedDistanceMeters,

            targetRpe,
          });

        /*
         * ==================================
         * SAFETY ENGINE
         * ==================================
         */
        const safety =
          getSessionRecoveryAnalysis(
            exercise
              .sessionExercises
          );

        const previousWeightKg =
          analysis
            .averageWeightKg;

        const previousDuration =
          previousPrescription
            ?.durationSeconds ??
          exercise
            .durationSeconds;

        const previousDistance =
          previousPrescription
            ?.distanceMeters ??
          exercise
            .distanceMeters;

        /*
         * ==================================
         * DECISÃO COMBINADA
         * ==================================
         */
        const safeProgression =
          applySafetyToProgression(
            {
              exerciseDecision:
                analysis.decision,

              suggestedWeightKg:
                analysis
                  .suggestedWeightKg,

              suggestedDurationSeconds:
                analysis
                  .suggestedDurationSeconds,

              suggestedDistanceMeters:
                analysis
                  .suggestedDistanceMeters,

              previousWeightKg,

              previousDurationSeconds:
                previousDuration,

              previousDistanceMeters:
                previousDistance,

              safety,
            }
          );

        /*
         * ==================================
         * EXPLICABILIDADE
         * ==================================
         *
         * O reason do motor de performance
         * + motivos do Safety Engine
         * formam a trilha da decisão.
         */
        const progressionReason =
          buildProgressionReason({
            exerciseDecision:
              analysis.decision,

            finalDecision:
              safeProgression
                .decision,

            performanceReason:
              analysis.reason,

            safety,
          });

        /*
         * ==================================
         * NOVA PRESCRIÇÃO
         * ==================================
         */
        return {
          workoutExerciseId:
            exercise.id,

          programWeek,

          executionType,

          sets:
            previousPrescription
              ?.sets ??
            exercise.sets,

          repsMin:
            previousPrescription
              ?.repsMin ??
            exercise.repsMin,

          repsMax:
            previousPrescription
              ?.repsMax ??
            exercise.repsMax,

          /*
           * TIME
           */
          durationSeconds:
            safeProgression
              .suggestedDurationSeconds ??
            previousPrescription
              ?.durationSeconds ??
            exercise
              .durationSeconds,

          /*
           * DISTANCE
           */
          distanceMeters:
            safeProgression
              .suggestedDistanceMeters ??
            previousPrescription
              ?.distanceMeters ??
            exercise
              .distanceMeters,

          restSeconds:
            previousPrescription
              ?.restSeconds ??
            exercise
              .restSeconds,

          targetRpe,

          /*
           * Carga após performance +
           * Safety Engine.
           */
          suggestedWeightKg:
            safeProgression
              .suggestedWeightKg,

          /*
           * Resultado final.
           */
          progressionDecision:
            safeProgression
              .decision,

          /*
           * NOVO:
           *
           * Estado de recuperação que
           * participou da decisão.
           */
          safetyStatus:
            safety?.status ??
            null,

          /*
           * NOVO:
           *
           * Explicação persistida da
           * decisão.
           */
          progressionReason,

          /*
           * ==================================
           * SNAPSHOT DA SEMANA ANTERIOR
           * ==================================
           *
           * Safety não altera histórico.
           */
          previousAverageWeightKg:
            analysis
              .averageWeightKg,

          previousAverageReps:
            analysis
              .averageReps,

          previousAverageRpe:
            analysis
              .averageRpe,

          previousAverageDurationSeconds:
            analysis
              .averageDurationSeconds,

          previousAverageDistanceMeters:
            analysis
              .averageDistanceMeters,

          notes:
            previousPrescription
              ?.notes ??
            exercise.notes,
        };
      }
    );

  /*
   * ==================================
   * PERSISTÊNCIA
   * ==================================
   */
  await prisma.$transaction(
    prescriptions.map(
      (prescription) =>
        prisma.workoutExercisePrescription.create(
          {
            data:
              prescription,
          }
        )
    )
  );

  return {
    created:
      prescriptions.length,

    alreadyExists:
      false,
  };
}