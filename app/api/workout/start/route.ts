import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const workoutId =
      body?.workoutId;

    if (
      !workoutId ||
      typeof workoutId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Treino inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email:
            session.user.email,
        },

        include: {
          athleteProfile: true,
        },
      });

    if (!user?.athleteProfile) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Perfil do atleta não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const athleteId =
      user.athleteProfile.id;

    /*
     * Validamos que o treino pertence ao
     * programa ativo do atleta autenticado.
     *
     * Também carregamos as prescrições
     * semanais para determinar exatamente
     * o que deve ser executado nesta semana.
     */
    const workout =
      await prisma.workout.findFirst({
        where: {
          id: workoutId,

          program: {
            athleteId,
            status: "ACTIVE",
          },
        },

        include: {
          program: true,

          exercises: {
            orderBy: {
              order: "asc",
            },

            include: {
              weeklyPrescriptions:
                true,
            },
          },
        },
      });

    if (!workout) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Treino não encontrado ou não pertence ao programa ativo.",
        },
        {
          status: 404,
        }
      );
    }

    const currentWeek =
      workout.program.currentWeek;

    /*
     * Apenas uma sessão IN_PROGRESS pode
     * existir por atleta na semana atual.
     *
     * Se existir, retomamos essa sessão.
     */
    const existingSession =
      await prisma.workoutSession.findFirst({
        where: {
          athleteId,

          programWeek:
            currentWeek,

          status: "IN_PROGRESS",
        },

        orderBy: {
          startedAt: "desc",
        },
      });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        sessionId:
          existingSession.id,
        resumed: true,
      });
    }

    /*
     * Montamos a prescrição operacional
     * da sessão.
     *
     * Prioridade:
     *
     * WorkoutExercisePrescription
     * da semana atual
     *
     *       ↓ fallback
     *
     * WorkoutExercise original
     */
    const exercisePrescriptions =
      workout.exercises.map(
        (workoutExercise) => {
          const weeklyPrescription =
            workoutExercise.weeklyPrescriptions.find(
              (prescription) =>
                prescription.programWeek ===
                currentWeek
            );

          return {
            workoutExercise,

            sets:
              weeklyPrescription?.sets ??
              workoutExercise.sets,

            suggestedWeightKg:
              weeklyPrescription
                ?.suggestedWeightKg ??
              null,
          };
        }
      );

    /*
     * Segurança:
     * nenhum exercício pode resultar em
     * zero séries.
     */
    const invalidPrescription =
      exercisePrescriptions.find(
        (item) =>
          item.sets <= 0
      );

    if (invalidPrescription) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Existe uma prescrição inválida neste treino.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Criamos:
     *
     * WorkoutSession
     *      ↓
     * WorkoutSessionExercise
     *      ↓
     * WorkoutSet
     *
     * A quantidade de séries vem da
     * prescrição semanal.
     *
     * Quando houver carga sugerida, ela
     * já é gravada como valor inicial da
     * série.
     */
    const workoutSession =
      await prisma.workoutSession.create({
        data: {
          athleteId,

          workoutId:
            workout.id,

          programWeek:
            currentWeek,

          status: "IN_PROGRESS",

          exercises: {
            create:
              exercisePrescriptions.map(
                ({
                  workoutExercise,
                  sets,
                  suggestedWeightKg,
                }) => ({
                  workoutExerciseId:
                    workoutExercise.id,

                  order:
                    workoutExercise.order,

                  sets: {
                    create:
                      Array.from(
                        {
                          length:
                            sets,
                        },
                        (
                          _,
                          index
                        ) => ({
                          setNumber:
                            index +
                            1,

                          /*
                           * Pré-preenchimento.
                           *
                           * O atleta poderá
                           * alterar esse valor
                           * na interface.
                           */
                          weightKg:
                            suggestedWeightKg,

                          completed:
                            false,
                        })
                      ),
                  },
                })
              ),
          },
        },

        include: {
          exercises: {
            include: {
              sets: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,

      sessionId:
        workoutSession.id,

      resumed: false,
    });
  } catch (error) {
    console.error(
      "START_WORKOUT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível iniciar o treino.",
      },
      {
        status: 500,
      }
    );
  }
}