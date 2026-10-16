import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrainingProfileChanges } from "@/lib/profile/training-profile-changes";

const weekDaySchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const goalSchema = z.enum([
  "STRENGTH",
  "GRIP",
  "POWER",
  "CONDITIONING",
  "MOBILITY",
  "HYPERTROPHY",
  "ENDURANCE",
  "INJURY_PREVENTION",
]);

const preferenceSchema = z.enum([
  "AVOID_BARBELL",
  "AVOID_HIGH_IMPACT",
  "PREFER_MACHINES",
  "PREFER_DUMBBELLS",
  "PREFER_CABLES",
  "PREFER_BODYWEIGHT",
]);

const onboardingSchema = z.object({
  age: z
    .number()
    .int()
    .min(18)
    .max(100),

  weightKg: z
    .number()
    .min(40)
    .max(300),

  heightCm: z
    .number()
    .min(130)
    .max(230),

  belt: z.enum([
    "WHITE",
    "BLUE",
    "PURPLE",
    "BROWN",
    "BLACK",
  ]),

  beltDegree: z
    .number()
    .int()
    .min(0)
    .max(6),

  experience: z.enum([
    "BEGINNER",
    "INTERMEDIATE",
    "ADVANCED",
  ]),

  giTraining: z.boolean(),
  noGiTraining: z.boolean(),

  bjjTrainingDays:
    z.array(weekDaySchema).min(1),

  strengthTrainingDays:
    z.array(weekDaySchema).min(2).max(4),

  sessionDurationMinutes:
    z.number().int().min(30).max(120),

  goals:
    z.array(goalSchema).min(1),

  goalPriorities: z.array(
    z.object({
      goal: goalSchema,
      priority: z.number().int().min(1),
    })
  ),

  restrictions: z.array(
    z.object({
      bodyArea: z.string().min(2),
      description: z.string().min(2),

      recovered: z.boolean(),

      medicallyCleared: z.boolean(),

      currentlyPainful: z.boolean(),
    })
  ),

  trainingPreferences:
    z.array(preferenceSchema),
});

export async function POST(
  request: Request
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = await request.json();

    const parsed =
      onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Existem informações inválidas no formulário.",

          issues:
            parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const data = parsed.data;

    const user =
      await prisma.user.findUnique({
        where: {
          email:
            session.user.email,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Usuário não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Numa edição de perfil (atleta já existente),
     * informamos se algo que afeta o programa mudou e
     * se há programa ativo, para a tela perguntar se o
     * atleta quer gerar um novo programa.
     *
     * A leitura fica fora da transação para não
     * alongá-la (o banco remoto tem latência alta).
     */
    const previousProfile =
      await prisma.athleteProfile.findUnique({
        where: {
          userId: user.id,
        },

        include: {
          goalPriorities: true,
          restrictions: true,

          trainingPrograms: {
            where: {
              status: "ACTIVE",
            },

            select: {
              id: true,
            },

            take: 1,
          },
        },
      });

    const changes = previousProfile
      ? getTrainingProfileChanges(
          previousProfile,
          data
        )
      : null;

    const hasActiveProgram =
      (previousProfile?.trainingPrograms
        .length ?? 0) > 0;

    await prisma.$transaction(
      async (tx) => {
        const existingProfile =
          await tx.athleteProfile.findUnique({
            where: {
              userId: user.id,
            },
          });

        if (existingProfile) {
          await tx.athleteGoalPriority.deleteMany({
            where: {
              athleteId:
                existingProfile.id,
            },
          });

          await tx.athleteRestriction.deleteMany({
            where: {
              athleteId:
                existingProfile.id,
            },
          });
        }

        const athlete =
          await tx.athleteProfile.upsert({
            where: {
              userId: user.id,
            },

            create: {
              userId: user.id,

              age: data.age,
              weightKg: data.weightKg,
              heightCm: data.heightCm,

              belt: data.belt,
              beltDegree:
                data.beltDegree,

              experience:
                data.experience,

              giTraining:
                data.giTraining,

              noGiTraining:
                data.noGiTraining,

              bjjDaysPerWeek:
                data.bjjTrainingDays.length,

              strengthDaysPerWeek:
                data.strengthTrainingDays.length,

              bjjTrainingDays:
                data.bjjTrainingDays,

              strengthTrainingDays:
                data.strengthTrainingDays,

              sessionDurationMinutes:
                data.sessionDurationMinutes,

              goals: data.goals,

              trainingPreferences:
                data.trainingPreferences,
            },

            update: {
              age: data.age,
              weightKg: data.weightKg,
              heightCm: data.heightCm,

              belt: data.belt,
              beltDegree:
                data.beltDegree,

              experience:
                data.experience,

              giTraining:
                data.giTraining,

              noGiTraining:
                data.noGiTraining,

              bjjDaysPerWeek:
                data.bjjTrainingDays.length,

              strengthDaysPerWeek:
                data.strengthTrainingDays.length,

              bjjTrainingDays:
                data.bjjTrainingDays,

              strengthTrainingDays:
                data.strengthTrainingDays,

              sessionDurationMinutes:
                data.sessionDurationMinutes,

              goals: data.goals,

              trainingPreferences:
                data.trainingPreferences,
            },
          });

        if (
          data.goalPriorities.length >
          0
        ) {
          await tx.athleteGoalPriority.createMany({
            data:
              data.goalPriorities.map(
                (item) => ({
                  athleteId:
                    athlete.id,

                  goal:
                    item.goal,

                  priority:
                    item.priority,
                })
              ),
          });
        }

        if (
          data.restrictions.length > 0
        ) {
          await tx.athleteRestriction.createMany({
            data:
              data.restrictions.map(
                (item) => ({
                  athleteId:
                    athlete.id,

                  bodyArea:
                    item.bodyArea,

                  description:
                    item.description,

                  recovered:
                    item.recovered,

                  medicallyCleared:
                    item.medicallyCleared,

                  currentlyPainful:
                    item.currentlyPainful,
                })
              ),
          });
        }

        await tx.user.update({
          where: {
            id: user.id,
          },

          data: {
            onboardingCompleted:
              true,
          },
        });
      }
    );

    return NextResponse.json({
      success: true,
      trainingChanged:
        changes?.changed ?? false,
      restrictionsChanged:
        changes?.restrictionsChanged ??
        false,
      hasActiveProgram,
    });
  } catch (error) {
    console.error(
      "ONBOARDING_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível salvar seu perfil.",
      },
      {
        status: 500,
      }
    );
  }
}