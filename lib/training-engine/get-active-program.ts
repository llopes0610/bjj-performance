import { prisma } from "@/lib/prisma";

export async function getActiveTrainingProgram(
  athleteId: string
) {
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
            exercises: {
              orderBy: {
                order: "asc",
              },

              include: {
                exercise: true,

                weeklyPrescriptions: {
                  orderBy: {
                    programWeek: "desc",
                  },
                },
              },
            },

            sessions: {
              where: {
                athleteId,
              },

              orderBy: {
                startedAt: "desc",
              },
            },
          },
        },
      },
    });

  if (!program) {
    return null;
  }

  /*
   * Mantemos somente:
   *
   * - sessões da semana atual;
   * - prescrição da semana atual.
   *
   * O histórico continua existindo no banco,
   * apenas não é enviado como parte do estado
   * operacional da tela /workout.
   */
  const workouts =
    program.workouts.map((workout) => ({
      ...workout,

      sessions:
        workout.sessions.filter(
          (session) =>
            session.programWeek ===
            program.currentWeek
        ),

      exercises:
        workout.exercises.map(
          (workoutExercise) => ({
            ...workoutExercise,

            weeklyPrescriptions:
              workoutExercise.weeklyPrescriptions.filter(
                (prescription) =>
                  prescription.programWeek ===
                  program.currentWeek
              ),
          })
        ),
    }));

  return {
    ...program,
    workouts,
  };
}