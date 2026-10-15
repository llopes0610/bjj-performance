import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  paymentRequiredResponseBody,
  userHasAccess,
} from "@/lib/billing/get-access";
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

    if (
      !(await userHasAccess(
        session.user.email
      ))
    ) {
      return NextResponse.json(
        paymentRequiredResponseBody(),
        {
          status: 402,
        }
      );
    }

    const body =
      await request.json();

    const setId =
      body?.setId;

    if (
      !setId ||
      typeof setId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Série inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const workoutSet =
      await prisma.workoutSet.findFirst({
        where: {
          id: setId,

          workoutSessionExercise: {
            workoutSession: {
              status:
                "IN_PROGRESS",

              athlete: {
                user: {
                  email:
                    session.user.email,
                },
              },
            },
          },
        },

        include: {
          workoutSessionExercise: {
            include: {
              workoutExercise: {
                include: {
                  weeklyPrescriptions:
                    true,
                },
              },

              workoutSession: true,
            },
          },
        },
      });

    if (!workoutSet) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Série não encontrada ou sessão encerrada.",
        },
        {
          status: 404,
        }
      );
    }

    const sessionExercise =
      workoutSet.workoutSessionExercise;

    const workoutExercise =
      sessionExercise.workoutExercise;

    const programWeek =
      sessionExercise.workoutSession
        .programWeek;

    const weeklyPrescription =
      workoutExercise.weeklyPrescriptions.find(
        (prescription) =>
          prescription.programWeek ===
          programWeek
      );

    const executionType =
      weeklyPrescription?.executionType ??
      workoutExercise.executionType;

    const rpe =
      Number(body?.rpe);

    if (
      !Number.isFinite(rpe) ||
      rpe < 1 ||
      rpe > 10
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Informe um RPE entre 1 e 10.",
        },
        {
          status: 400,
        }
      );
    }

    let weightKg:
      | number
      | null = null;

    let reps:
      | number
      | null = null;

    let durationSeconds:
      | number
      | null = null;

    let distanceMeters:
      | number
      | null = null;

    /*
     * REPS
     */
    if (executionType === "REPS") {
      const parsedWeight =
        body?.weightKg === "" ||
        body?.weightKg === null ||
        body?.weightKg === undefined
          ? null
          : Number(body.weightKg);

      const parsedReps =
        Number(body?.reps);

      if (
        parsedWeight !== null &&
        (!Number.isFinite(
          parsedWeight
        ) ||
          parsedWeight < 0)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe uma carga válida.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isInteger(
          parsedReps
        ) ||
        parsedReps <= 0 ||
        parsedReps > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe uma quantidade válida de repetições.",
          },
          {
            status: 400,
          }
        );
      }

      weightKg =
        parsedWeight;

      reps =
        parsedReps;
    }

    /*
     * TIME
     */
    if (executionType === "TIME") {
      const parsedDuration =
        Number(
          body?.durationSeconds
        );

      if (
        !Number.isInteger(
          parsedDuration
        ) ||
        parsedDuration <= 0 ||
        parsedDuration >
          3600
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe uma duração válida.",
          },
          {
            status: 400,
          }
        );
      }

      durationSeconds =
        parsedDuration;

      const parsedWeight =
        body?.weightKg === "" ||
        body?.weightKg === null ||
        body?.weightKg === undefined
          ? null
          : Number(body.weightKg);

      if (
        parsedWeight !== null &&
        (!Number.isFinite(
          parsedWeight
        ) ||
          parsedWeight < 0)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe uma carga válida.",
          },
          {
            status: 400,
          }
        );
      }

      weightKg =
        parsedWeight;
    }

    /*
     * DISTANCE
     */
    if (
      executionType ===
      "DISTANCE"
    ) {
      const parsedDistance =
        Number(
          body?.distanceMeters
        );

      if (
        !Number.isFinite(
          parsedDistance
        ) ||
        parsedDistance <= 0 ||
        parsedDistance > 10000
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe uma distância válida.",
          },
          {
            status: 400,
          }
        );
      }

      distanceMeters =
        parsedDistance;

      const parsedWeight =
        body?.weightKg === "" ||
        body?.weightKg === null ||
        body?.weightKg === undefined
          ? null
          : Number(body.weightKg);

      if (
        parsedWeight !== null &&
        (!Number.isFinite(
          parsedWeight
        ) ||
          parsedWeight < 0)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Informe uma carga válida.",
          },
          {
            status: 400,
          }
        );
      }

      weightKg =
        parsedWeight;
    }

    const updatedSet =
      await prisma.workoutSet.update({
        where: {
          id: workoutSet.id,
        },

        data: {
          weightKg,
          reps,
          durationSeconds,
          distanceMeters,
          rpe,

          completed: true,

          completedAt:
            new Date(),
        },
      });

    /*
     * Depois de salvar verificamos
     * se ainda existe alguma série
     * pendente neste exercício.
     */
    const remainingSets =
      await prisma.workoutSet.count({
        where: {
          workoutSessionExerciseId:
            sessionExercise.id,

          completed: false,
        },
      });

    const exerciseCompleted =
      remainingSets === 0;

    if (exerciseCompleted) {
      await prisma.workoutSessionExercise.update({
        where: {
          id:
            sessionExercise.id,
        },

        data: {
          completed: true,
        },
      });
    }

    return NextResponse.json({
      success: true,

      executionType,

      exerciseCompleted,

      set: updatedSet,
    });
  } catch (error) {
    console.error(
      "COMPLETE_WORKOUT_SET_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível registrar a série.",
      },
      {
        status: 500,
      }
    );
  }
}