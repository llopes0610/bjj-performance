import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { processWorkoutCompletion } from "@/lib/gamification/process-workout-completion";
import { prisma } from "@/lib/prisma";

const VALID_FEELINGS = [
  "VERY_GOOD",
  "GOOD",
  "NORMAL",
  "TIRED",
  "VERY_TIRED",
] as const;

type PostWorkoutFeeling =
  (typeof VALID_FEELINGS)[number];

interface FinishWorkoutBody {
  workoutSessionId?: unknown;

  sessionRpe?: unknown;

  postWorkoutFeeling?: unknown;

  hasPain?: unknown;

  painRegion?: unknown;

  painIntensity?: unknown;

  painNotes?: unknown;
}

function isValidFeeling(
  value: unknown
): value is PostWorkoutFeeling {
  return (
    typeof value === "string" &&
    VALID_FEELINGS.some(
      (feeling) => feeling === value
    )
  );
}

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
      (await request.json()) as FinishWorkoutBody;

    const workoutSessionId =
      body.workoutSessionId;

    const sessionRpe =
      body.sessionRpe;

    const postWorkoutFeeling =
      body.postWorkoutFeeling;

    const hasPain =
      body.hasPain;

    const painRegion =
      body.painRegion;

    const painIntensity =
      body.painIntensity;

    const painNotes =
      body.painNotes;

    /*
     * SESSÃO
     */
    if (
      !workoutSessionId ||
      typeof workoutSessionId !==
        "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Sessão inválida.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * SESSION RPE
     *
     * É diferente do RPE das séries.
     * Representa o esforço percebido
     * do treino inteiro.
     */
    if (
      typeof sessionRpe !==
        "number" ||
      !Number.isFinite(
        sessionRpe
      ) ||
      sessionRpe < 1 ||
      sessionRpe > 10
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Informe um esforço geral entre 1 e 10.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * SENSAÇÃO PÓS-TREINO
     */
    if (
      !isValidFeeling(
        postWorkoutFeeling
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Informe como você se sente após o treino.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * DOR
     */
    if (
      typeof hasPain !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Informe se houve dor durante o treino.",
        },
        {
          status: 400,
        }
      );
    }

    let normalizedPainRegion:
      | string
      | null = null;

    let normalizedPainIntensity:
      | number
      | null = null;

    let normalizedPainNotes:
      | string
      | null = null;

    if (hasPain) {
      if (
        typeof painRegion !==
          "string" ||
        !painRegion.trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe onde você sentiu dor.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        typeof painIntensity !==
          "number" ||
        !Number.isInteger(
          painIntensity
        ) ||
        painIntensity < 1 ||
        painIntensity > 10
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe a intensidade da dor entre 1 e 10.",
          },
          {
            status: 400,
          }
        );
      }

      normalizedPainRegion =
        painRegion
          .trim()
          .slice(0, 100);

      normalizedPainIntensity =
        painIntensity;

      if (
        typeof painNotes ===
          "string" &&
        painNotes.trim()
      ) {
        normalizedPainNotes =
          painNotes
            .trim()
            .slice(0, 500);
      }
    }

    /*
     * BUSCAMOS SOMENTE UMA SESSÃO
     * EM ANDAMENTO PERTENCENTE AO
     * ATLETA AUTENTICADO.
     */
    const workoutSession =
      await prisma.workoutSession.findFirst(
        {
          where: {
            id: workoutSessionId,

            status:
              "IN_PROGRESS",

            athlete: {
              user: {
                email:
                  session.user.email,
              },
            },
          },

          include: {
            workout: {
              select: {
                programId: true,
              },
            },

            exercises: {
              include: {
                sets: true,
              },
            },
          },
        }
      );

    if (!workoutSession) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sessão não encontrada ou já finalizada.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * NÃO PERMITIMOS FINALIZAR
     * ENQUANTO HOUVER EXERCÍCIO
     * INCOMPLETO.
     */
    const incompleteExercise =
      workoutSession.exercises.some(
        (exercise) =>
          !exercise.completed
      );

    if (incompleteExercise) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Conclua todas as séries antes de finalizar o treino.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * SEGURANÇA ADICIONAL:
     *
     * Mesmo que WorkoutSessionExercise
     * esteja marcado como concluído,
     * verificamos todas as séries.
     */
    const incompleteSet =
      workoutSession.exercises.some(
        (exercise) =>
          exercise.sets.some(
            (set) =>
              !set.completed
          )
      );

    if (incompleteSet) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Existem séries pendentes neste treino.",
        },
        {
          status: 400,
        }
      );
    }

    const completedAt =
      new Date();

    const durationMilliseconds =
      completedAt.getTime() -
      workoutSession.startedAt.getTime();

    const durationMinutes =
      Math.max(
        1,
        Math.round(
          durationMilliseconds /
            1000 /
            60
        )
      );

    /*
     * FINALIZAÇÃO ATÔMICA DO ESTADO
     *
     * Feedback + conclusão são gravados
     * no mesmo update.
     *
     * Assim não existe uma sessão
     * COMPLETED sem o feedback desta
     * etapa.
     *
     * A gamificação (XP do treino, semana,
     * streak e conquistas) roda na mesma
     * transação: não existe sessão
     * COMPLETED sem os efeitos
     * correspondentes.
     */
    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Update condicional:
           * um retry/duplo clique
           * concorrente não finaliza a
           * mesma sessão duas vezes.
           */
          const updated =
            await tx.workoutSession.updateMany(
              {
                where: {
                  id:
                    workoutSession.id,

                  status:
                    "IN_PROGRESS",
                },

                data: {
                  status:
                    "COMPLETED",

                  completedAt,

                  durationMinutes,

                  sessionRpe,

                  postWorkoutFeeling,

                  hasPain,

                  painRegion:
                    normalizedPainRegion,

                  painIntensity:
                    normalizedPainIntensity,

                  painNotes:
                    normalizedPainNotes,
                },
              }
            );

          if (updated.count !== 1) {
            return null;
          }

          return processWorkoutCompletion(
            tx,
            {
              athleteId:
                workoutSession.athleteId,

              workoutId:
                workoutSession.workoutId,

              programId:
                workoutSession.workout
                  .programId,

              programWeek:
                workoutSession.programWeek,

              occurredAt:
                completedAt,
            }
          );
        }
      );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sessão não encontrada ou já finalizada.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      sessionId:
        workoutSession.id,

      durationMinutes,

      gamification: result,
    });
  } catch (error) {
    console.error(
      "FINISH_WORKOUT_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível finalizar o treino.",
      },
      {
        status: 500,
      }
    );
  }
}