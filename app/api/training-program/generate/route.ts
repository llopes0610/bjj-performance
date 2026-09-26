import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { generateTrainingProgram } from "@/lib/training-engine/generate-program";

export async function POST() {
  const session =
    await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        error:
          "Não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const user =
      await prisma.user.findUnique({
        where: {
          email:
            session.user.email,
        },

        include: {
          athleteProfile:
            true,
        },
      });

    if (
      !user?.athleteProfile
    ) {
      return NextResponse.json(
        {
          error:
            "Perfil do atleta não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const result =
      await generateTrainingProgram(
        user.athleteProfile.id
      );

    return NextResponse.json({
      success: true,

      programId:
        result.program.id,

      phase:
        result.recommendation.phase,

      recommendation: {
        recommendedStrengthDays:
          result.recommendation
            .recommendedStrengthDays,

        baseRpeMin:
          result.recommendation
            .baseRpeMin,

        baseRpeMax:
          result.recommendation
            .baseRpeMax,

        gripVolume:
          result.recommendation
            .gripVolume,

        conditioningVolume:
          result.recommendation
            .conditioningVolume,

        reasons:
          result.recommendation
            .reasons,
      },
    });
  } catch (error) {
    console.error(
      "GENERATE_PROGRAM_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível gerar o programa.",
      },
      {
        status: 500,
      }
    );
  }
}