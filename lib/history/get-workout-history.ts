import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 50;

export type WorkoutHistoryPeriod =
  | "30d"
  | "90d"
  | "6m"
  | "all";

type GetWorkoutHistoryOptions = {
  page?: number;
  pageSize?: number;
  period?: WorkoutHistoryPeriod;
  workoutCode?: string | null;
  programId?: string | null;
};

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number
) {
  if (!value || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function getPeriodStartDate(
  period: WorkoutHistoryPeriod
) {
  if (period === "all") {
    return null;
  }

  const date = new Date();

  if (period === "30d") {
    date.setDate(date.getDate() - 30);
    return date;
  }

  if (period === "90d") {
    date.setDate(date.getDate() - 90);
    return date;
  }

  date.setMonth(date.getMonth() - 6);
  return date;
}

export async function getWorkoutHistory(
  athleteId: string,
  options: GetWorkoutHistoryOptions = {}
) {
  const page = normalizePositiveInteger(
    options.page,
    1
  );

  const requestedPageSize =
    normalizePositiveInteger(
      options.pageSize,
      DEFAULT_PAGE_SIZE
    );

  const pageSize = Math.min(
    requestedPageSize,
    MAX_PAGE_SIZE
  );

  const period =
    options.period ?? "all";

  const workoutCode =
    options.workoutCode?.trim() || null;

  const programId =
    options.programId?.trim() || null;

  const periodStartDate =
    getPeriodStartDate(period);

  const sessionWhere = {
    athleteId,
    status: "COMPLETED" as const,

    ...(periodStartDate
      ? {
          completedAt: {
            gte: periodStartDate,
          },
        }
      : {}),

    ...(workoutCode || programId
      ? {
          workout: {
            ...(workoutCode
              ? {
                  code: workoutCode,
                }
              : {}),

            ...(programId
              ? {
                  programId,
                }
              : {}),
          },
        }
      : {}),
  };

  const setSessionWhere = {
    athleteId,
    status: "COMPLETED" as const,

    ...(periodStartDate
      ? {
          completedAt: {
            gte: periodStartDate,
          },
        }
      : {}),

    ...(workoutCode || programId
      ? {
          workout: {
            ...(workoutCode
              ? {
                  code: workoutCode,
                }
              : {}),

            ...(programId
              ? {
                  programId,
                }
              : {}),
          },
        }
      : {}),
  };

  const [
    totalSessions,
    sessionAggregates,
    totalSets,
    availableProgramsRaw,
    availableWorkoutCodesRaw,
  ] = await prisma.$transaction([
    prisma.workoutSession.count({
      where: sessionWhere,
    }),

    prisma.workoutSession.aggregate({
      where: sessionWhere,

      _sum: {
        durationMinutes: true,
      },

      _avg: {
        sessionRpe: true,
      },
    }),

    prisma.workoutSet.count({
      where: {
        completed: true,

        workoutSessionExercise: {
          workoutSession:
            setSessionWhere,
        },
      },
    }),

    prisma.trainingProgram.findMany({
      where: {
        athleteId,

        workouts: {
          some: {
            sessions: {
              some: {
                athleteId,
                status: "COMPLETED",
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,
        phase: true,
        startedAt: true,
      },
    }),

    prisma.workout.findMany({
      where: {
        program: {
          athleteId,
        },

        sessions: {
          some: {
            athleteId,
            status: "COMPLETED",
          },
        },
      },

      distinct: ["code"],

      orderBy: {
        code: "asc",
      },

      select: {
        code: true,
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalSessions / pageSize)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const sessions =
    await prisma.workoutSession.findMany({
      where: sessionWhere,

      skip:
        (currentPage - 1) *
        pageSize,

      take: pageSize,

      orderBy: [
        {
          completedAt: "desc",
        },
        {
          startedAt: "desc",
        },
      ],

      include: {
        workout: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,

            program: {
              select: {
                id: true,
                name: true,
                phase: true,
              },
            },
          },
        },

        exercises: {
          orderBy: {
            order: "asc",
          },

          include: {
            workoutExercise: {
              select: {
                id: true,
                order: true,
                block: true,
                executionType: true,

                exercise: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                    primaryRegion: true,
                  },
                },
              },
            },

            sets: {
              orderBy: {
                setNumber: "asc",
              },
            },
          },
        },
      },
    });

  const items = sessions.map(
    (session) => {
      const completedSets =
        session.exercises.flatMap(
          (sessionExercise) =>
            sessionExercise.sets.filter(
              (set) => set.completed
            )
        );

      const setsWithWeight =
        completedSets.filter(
          (set) =>
            set.weightKg !== null &&
            set.weightKg > 0
        );

      const setsWithRpe =
        completedSets.filter(
          (set) => set.rpe !== null
        );

      const totalVolumeKg =
        completedSets.reduce(
          (total, set) => {
            if (
              set.weightKg === null ||
              set.reps === null
            ) {
              return total;
            }

            return (
              total +
              set.weightKg * set.reps
            );
          },
          0
        );

      const averageWeightKg =
        setsWithWeight.length > 0
          ? setsWithWeight.reduce(
              (total, set) =>
                total +
                (set.weightKg ?? 0),
              0
            ) / setsWithWeight.length
          : null;

      const averageSetRpe =
        setsWithRpe.length > 0
          ? setsWithRpe.reduce(
              (total, set) =>
                total +
                (set.rpe ?? 0),
              0
            ) / setsWithRpe.length
          : null;

      return {
        id: session.id,
        programWeek:
          session.programWeek,
        startedAt:
          session.startedAt,
        completedAt:
          session.completedAt,
        durationMinutes:
          session.durationMinutes,
        sessionRpe:
          session.sessionRpe,
        postWorkoutFeeling:
          session.postWorkoutFeeling,
        hasPain:
          session.hasPain,
        painRegion:
          session.painRegion,
        painIntensity:
          session.painIntensity,
        painNotes:
          session.painNotes,
        notes:
          session.notes,

        workout: {
          id: session.workout.id,
          code: session.workout.code,
          name: session.workout.name,
          type: session.workout.type,
        },

        program: {
          id:
            session.workout.program.id,
          name:
            session.workout.program.name,
          phase:
            session.workout.program.phase,
        },

        summary: {
          exerciseCount:
            session.exercises.length,

          completedExerciseCount:
            session.exercises.filter(
              (exercise) =>
                exercise.completed
            ).length,

          completedSets:
            completedSets.length,

          totalVolumeKg:
            Math.round(totalVolumeKg),

          averageWeightKg:
            averageWeightKg !== null
              ? Math.round(
                  averageWeightKg * 10
                ) / 10
              : null,

          averageSetRpe:
            averageSetRpe !== null
              ? Math.round(
                  averageSetRpe * 10
                ) / 10
              : null,
        },

        exercises:
          session.exercises.map(
            (sessionExercise) => ({
              id: sessionExercise.id,
              completed:
                sessionExercise.completed,
              order:
                sessionExercise.order,
              workoutExerciseId:
                sessionExercise
                  .workoutExerciseId,

              exercise: {
                id:
                  sessionExercise
                    .workoutExercise
                    .exercise.id,
                slug:
                  sessionExercise
                    .workoutExercise
                    .exercise.slug,
                name:
                  sessionExercise
                    .workoutExercise
                    .exercise.name,
                primaryRegion:
                  sessionExercise
                    .workoutExercise
                    .exercise
                    .primaryRegion,
                block:
                  sessionExercise
                    .workoutExercise
                    .block,
                executionType:
                  sessionExercise
                    .workoutExercise
                    .executionType,
              },

              sets:
                sessionExercise.sets.map(
                  (set) => ({
                    id: set.id,
                    setNumber:
                      set.setNumber,
                    weightKg:
                      set.weightKg,
                    reps: set.reps,
                    rpe: set.rpe,
                    durationSeconds:
                      set.durationSeconds,
                    distanceMeters:
                      set.distanceMeters,
                    completed:
                      set.completed,
                    completedAt:
                      set.completedAt,
                  })
                ),
            })
          ),
      };
    }
  );

  return {
    items,

    summary: {
      totalSessions,
      totalMinutes:
        sessionAggregates._sum
          .durationMinutes ?? 0,
      averageSessionRpe:
        sessionAggregates._avg
          .sessionRpe ?? null,
      totalSets,
    },

    pagination: {
      page: currentPage,
      pageSize,
      totalItems: totalSessions,
      totalPages,
      hasPreviousPage:
        currentPage > 1,
      hasNextPage:
        currentPage < totalPages,
    },

    filters: {
      period,
      workoutCode,
      programId,
    },

    filterOptions: {
      workoutCodes:
        availableWorkoutCodesRaw.map(
          (item) => item.code
        ),

      programs:
        availableProgramsRaw.map(
          (program) => ({
            id: program.id,
            name: program.name,
            phase: program.phase,
            startedAt:
              program.startedAt,
          })
        ),
    },
  };
}

export type WorkoutHistory =
  Awaited<
    ReturnType<
      typeof getWorkoutHistory
    >
  >;

export type WorkoutHistoryItem =
  WorkoutHistory["items"][number];
