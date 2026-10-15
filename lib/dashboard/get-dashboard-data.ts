import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/gamification/calculate-level";

import { analyzeSessionRecovery } from "@/lib/training-engine/safety/analyze-session-recovery";

type DashboardRecoveryStatus =

  | "READY"

  | "CAUTION"

  | "FATIGUED"

  | "PAIN_ALERT"

  | "NO_DATA";

type DashboardProgressionDecision =

  | "PROGRESS"

  | "MAINTAIN"

  | "REGRESS"

  | "NO_DATA";

type DashboardWorkoutStatus =

  | "COMPLETED"

  | "IN_PROGRESS"

  | "NEXT"

  | "PENDING";

function calculatePercentage(

  completed: number,

  total: number

) {

  if (total === 0) {

    return 0;

  }

  return Math.min(

    100,

    Math.round(

      (completed / total) * 100

    )

  );

}

function getLatestDate(

  completedAt: Date | null,

  startedAt: Date

) {

  return (

    completedAt ??

    startedAt

  );

}

export async function getDashboardData(

  athleteId: string

) {

  /*

   * ========================================

   * ATLETA

   * ========================================

   */

  const athlete =

    await prisma.athleteProfile.findUnique({

      where: {

        id: athleteId,

      },

      include: {

        user: {

          select: {

            name: true,

          },

        },

        gamificationProfile: {
          select: {
            totalXp: true,
            currentStreak: true,
            longestStreak: true,
          },
        },

      },

    });

  if (!athlete) {
    return null;
  }

  /*
   * ========================================
   * GAMIFICAÇÃO
   * ========================================
   *
   * Nível e XP do nível são calculados pela
   * engine central de gamificação, mantendo
   * totalXp como fonte de verdade persistida.
   */

  const gamification =
    athlete.gamificationProfile;

  const totalXp =
    gamification?.totalXp ?? 0;

  const levelProgress =
    calculateLevel(totalXp);

  const currentLevel =
    levelProgress.level;

  const currentXp =
    levelProgress.currentLevelXp;

  const currentStreak =
    gamification?.currentStreak ?? 0;

  const longestStreak =
    gamification?.longestStreak ?? 0;

/*

   * ========================================

   * PROGRAMA ATIVO

   * ========================================

   */

  const program =

    await prisma.trainingProgram.findFirst({

      where: {

        athleteId,

        status: "ACTIVE",

      },

      orderBy: {

        createdAt: "desc",

      },

      include: {

        workouts: {

          orderBy: {

            order: "asc",

          },

          include: {

            sessions: {

              where: {

                athleteId,

              },

              orderBy: {

                startedAt: "desc",

              },

            },

            exercises: {

              orderBy: {

                order: "asc",

              },

              include: {

                weeklyPrescriptions: {

                  orderBy: {

                    programWeek:

                      "desc",

                  },

                },

              },

            },

          },

        },

      },

    });

  /*

   * ========================================

   * ESTATÍSTICAS GLOBAIS

   * ========================================

   */

  const completedSessions =

    await prisma.workoutSession.count({

      where: {

        athleteId,

        status: "COMPLETED",

      },

    });

  /*

   * ========================================

   * ÚLTIMA SESSÃO CONCLUÍDA

   * ========================================

   */

  const lastCompletedSession =

    await prisma.workoutSession.findFirst({

      where: {

        athleteId,

        status: "COMPLETED",

      },

      orderBy: {

        completedAt: "desc",

      },

      select: {

        id: true,

        programWeek: true,

        sessionRpe: true,

        postWorkoutFeeling: true,

        hasPain: true,

        painRegion: true,

        painIntensity: true,

        completedAt: true,

        startedAt: true,

        workout: {

          select: {

            code: true,

            name: true,

          },

        },

      },

    });

  /*

   * ========================================

   * RECOVERY / SAFETY ATUAL

   * ========================================

   *

   * O estado exibido no dashboard deve

   * representar o feedback da sessão mais

   * recente.

   *

   * O safetyStatus armazenado nas prescrições

   * continua existindo como registro da decisão

   * usada pelo motor ao gerar a semana, mas não

   * representa necessariamente o estado atual

   * do atleta.

   */

  const recoveryAnalysis =

    lastCompletedSession

      ? analyzeSessionRecovery({

          sessionRpe:

            lastCompletedSession.sessionRpe,

          postWorkoutFeeling:

            lastCompletedSession.postWorkoutFeeling,

          hasPain:

            lastCompletedSession.hasPain,

          painRegion:

            lastCompletedSession.painRegion,

          painIntensity:

            lastCompletedSession.painIntensity,

        })

      : null;

  const recovery = {

    sessionId:

      lastCompletedSession?.id ??

      null,

    status:

      recoveryAnalysis?.status ??

      ("NO_DATA" as DashboardRecoveryStatus),

    fatigueScore:

      recoveryAnalysis?.fatigueScore ??

      null,

    progressionPermission:

      recoveryAnalysis

        ?.progressionPermission ??

      null,

    shouldReduceVolume:

      recoveryAnalysis

        ?.shouldReduceVolume ??

      false,

    shouldBlockProgression:

      recoveryAnalysis

        ?.shouldBlockProgression ??

      false,

    shouldConsiderExerciseSubstitution:

      recoveryAnalysis

        ?.shouldConsiderExerciseSubstitution ??

      false,

    reasons:

      recoveryAnalysis?.reasons ??

      [],

    lastSessionRpe:

      lastCompletedSession

        ?.sessionRpe ??

      null,

    feeling:

      lastCompletedSession

        ?.postWorkoutFeeling ??

      null,

    hasPain:

      lastCompletedSession

        ?.hasPain ??

      null,

    painRegion:

      lastCompletedSession

        ?.painRegion ??

      null,

    painIntensity:

      lastCompletedSession

        ?.painIntensity ??

      null,

    workoutCode:

      lastCompletedSession

        ?.workout.code ??

      null,

    workoutName:

      lastCompletedSession

        ?.workout.name ??

      null,

    completedAt:

      lastCompletedSession

        ? getLatestDate(

            lastCompletedSession

              .completedAt,

            lastCompletedSession

              .startedAt

          )

        : null,

  };

  /*

   * ========================================

   * SEM PROGRAMA ATIVO

   * ========================================

   */

  if (!program) {

    return {

      athlete: {

        id: athlete.id,

        name:

          athlete.user.name ??

          "Atleta",

        belt:

          athlete.belt,

        beltDegree:

          athlete.beltDegree,

        currentLevel:

          currentLevel,

        currentXp:

          currentXp,

        totalXp:

          totalXp,

        currentStreak:

          currentStreak,

        longestStreak:

          longestStreak,

        weightKg:

          athlete.weightKg,

        heightCm:

          athlete.heightCm,

        bjjDaysPerWeek:

          athlete.bjjDaysPerWeek,

      },

      program: null,

      week: {

        currentWeek: null,

        completedWorkouts: 0,

        totalWorkouts: 0,

        completionPercentage: 0,

        isCompleted: false,

        workouts: [],

      },

      nextWorkout: null,

      performance: {

        progressions: 0,

        maintained: 0,

        regressions: 0,

        noData: 0,

        total: 0,

      },

      recovery,

      stats: {

        completedSessions,

        currentStreak:

          currentStreak,

        longestStreak:

          longestStreak,

      },

    };

  }

  const currentWeek =

    program.currentWeek;

  /*

   * ========================================

   * SESSÕES DA SEMANA

   * ========================================

   */

  const completedWorkoutIds =

    new Set<string>();

  let inProgressWorkoutId:

    | string

    | null = null;

  for (

    const workout of

    program.workouts

  ) {

    const currentWeekSessions =

      workout.sessions.filter(

        (session) =>

          session.programWeek ===

          currentWeek

      );

    const completed =

      currentWeekSessions.some(

        (session) =>

          session.status ===

          "COMPLETED"

      );

    if (completed) {

      completedWorkoutIds.add(

        workout.id

      );

    }

    /*

     * Se existir uma sessão em andamento,

     * ela tem prioridade como treino atual.

     */

    if (

      !inProgressWorkoutId &&

      currentWeekSessions.some(

        (session) =>

          session.status ===

          "IN_PROGRESS"

      )

    ) {

      inProgressWorkoutId =

        workout.id;

    }

  }

  const totalWorkouts =

    program.workouts.length;

  const completedWorkouts =

    completedWorkoutIds.size;

  const completionPercentage =

    calculatePercentage(

      completedWorkouts,

      totalWorkouts

    );

  /*

   * ========================================

   * PRÓXIMO TREINO

   * ========================================

   *

   * Prioridade:

   *

   * 1. sessão em andamento;

   * 2. primeiro treino não concluído;

   * 3. null quando a semana acabou.

   */

  let nextWorkout =

    inProgressWorkoutId

      ? program.workouts.find(

          (workout) =>

            workout.id ===

            inProgressWorkoutId

        ) ?? null

      : null;

  if (!nextWorkout) {

    nextWorkout =

      program.workouts.find(

        (workout) =>

          !completedWorkoutIds.has(

            workout.id

          )

      ) ?? null;

  }

  /*

   * ========================================

   * STATUS INDIVIDUAL A / B / C

   * ========================================

   */

  const weeklyWorkouts =

    program.workouts.map(

      (workout) => {

        const currentWeekSessions =

          workout.sessions.filter(

            (session) =>

              session.programWeek ===

              currentWeek

          );

        const isCompleted =

          currentWeekSessions.some(

            (session) =>

              session.status ===

              "COMPLETED"

          );

        const isInProgress =

          currentWeekSessions.some(

            (session) =>

              session.status ===

              "IN_PROGRESS"

          );

        let status:

          DashboardWorkoutStatus =

          "PENDING";

        if (isCompleted) {

          status = "COMPLETED";

        } else if (isInProgress) {

          status =

            "IN_PROGRESS";

        } else if (

          nextWorkout?.id ===

          workout.id

        ) {

          status = "NEXT";

        }

        return {

          id: workout.id,

          code:

            workout.code,

          name:

            workout.name,

          order:

            workout.order,

          estimatedDurationMinutes:

            workout.estimatedDurationMinutes,

          exerciseCount:

            workout.exercises.length,

          status,

        };

      }

    );

  /*

   * ========================================

   * PERFORMANCE DA SEMANA

   * ========================================

   */

  const progressionDecisions:

    DashboardProgressionDecision[] =

    program.workouts.flatMap(

      (workout) =>

        workout.exercises.map(

          (exercise) => {

            const prescription =

              exercise.weeklyPrescriptions.find(

                (item) =>

                  item.programWeek ===

                  currentWeek

              );

            return (

              prescription

                ?.progressionDecision ??

              "NO_DATA"

            );

          }

        )

    );

  const progressions =

    progressionDecisions.filter(

      (decision) =>

        decision ===

        "PROGRESS"

    ).length;

  const maintained =

    progressionDecisions.filter(

      (decision) =>

        decision ===

        "MAINTAIN"

    ).length;

  const regressions =

    progressionDecisions.filter(

      (decision) =>

        decision ===

        "REGRESS"

    ).length;

  const noData =

    progressionDecisions.filter(

      (decision) =>

        decision ===

        "NO_DATA"

    ).length;

  /*

   * ========================================

   * RETORNO CONSOLIDADO

   * ========================================

   */

  return {

    athlete: {

      id: athlete.id,

      name:

        athlete.user.name ??

        "Atleta",

      belt:

        athlete.belt,

      beltDegree:

        athlete.beltDegree,

      currentLevel:

        currentLevel,

      currentXp:

        currentXp,

      totalXp:

        totalXp,

      currentStreak:

        currentStreak,

      longestStreak:

        longestStreak,

      weightKg:

        athlete.weightKg,

      heightCm:

        athlete.heightCm,

      bjjDaysPerWeek:

        athlete.bjjDaysPerWeek,

    },

    program: {

      id: program.id,

      name:

        program.name,

      phase:

        program.phase,

      currentWeek:

        program.currentWeek,

      durationWeeks:

        program.durationWeeks,

      recommendedStrengthDays:

        program.recommendedStrengthDays,

      baseRpeMin:

        program.baseRpeMin,

      baseRpeMax:

        program.baseRpeMax,

    },

    week: {

      currentWeek,

      completedWorkouts,

      totalWorkouts,

      completionPercentage,

      isCompleted:

        totalWorkouts > 0 &&

        completedWorkouts ===

          totalWorkouts,

      workouts:

        weeklyWorkouts,

    },

    nextWorkout:

      nextWorkout

        ? {

            id:

              nextWorkout.id,

            code:

              nextWorkout.code,

            name:

              nextWorkout.name,

            description:

              nextWorkout.description,

            estimatedDurationMinutes:

              nextWorkout

                .estimatedDurationMinutes,

            exerciseCount:

              nextWorkout

                .exercises.length,

            inProgress:

              nextWorkout.id ===

              inProgressWorkoutId,

          }

        : null,

    performance: {

      progressions,

      maintained,

      regressions,

      noData,

      total:

        progressionDecisions.length,

    },

    recovery,

    stats: {

      completedSessions,

      currentStreak:

        currentStreak,

      longestStreak:

        longestStreak,

    },

  };

}

export type DashboardData =

  NonNullable<

    Awaited<

      ReturnType<

        typeof getDashboardData

      >

    >

  >;