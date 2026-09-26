import { prisma } from "@/lib/prisma";

import { analyzeAthlete } from "./analyze-athlete";
import { foundationWorkouts } from "./foundation-template";

export async function generateTrainingProgram(
  athleteId: string
) {
  const athlete =
    await prisma.athleteProfile.findUnique({
      where: {
        id: athleteId,
      },

      include: {
        restrictions: true,
        goalPriorities: {
          orderBy: {
            priority: "asc",
          },
        },
      },
    });

  if (!athlete) {
    throw new Error(
      "Perfil do atleta não encontrado."
    );
  }

  const hasActiveRestriction =
    athlete.restrictions.some(
      (restriction) =>
        restriction.active &&
        !restriction.recovered
    );

  const hasCurrentPain =
    athlete.restrictions.some(
      (restriction) =>
        restriction.currentlyPainful
    );

  const recommendation =
    analyzeAthlete({
      age: athlete.age,

      weightKg: athlete.weightKg,
      heightCm: athlete.heightCm,

      bjjDaysPerWeek:
        athlete.bjjDaysPerWeek,

      strengthDaysPerWeek:
        athlete.strengthDaysPerWeek,

      giTraining:
        athlete.giTraining,

      noGiTraining:
        athlete.noGiTraining,

      sessionDurationMinutes:
        athlete.sessionDurationMinutes,

      goals:
        athlete.goalPriorities.length
          ? athlete.goalPriorities.map(
              (item) => item.goal
            )
          : athlete.goals,

      trainingPreferences:
        athlete.trainingPreferences,

      hasActiveRestriction,
      hasCurrentPain,
    });

  const numberOfWorkouts =
    recommendation.recommendedStrengthDays;

  const selectedTemplates =
    foundationWorkouts.slice(
      0,
      numberOfWorkouts
    );

  const exerciseSlugs =
    Array.from(
      new Set(
        selectedTemplates.flatMap(
          (workout) =>
            workout.exercises.map(
              (exercise) =>
                exercise.slug
            )
        )
      )
    );

  const exercises =
    await prisma.exercise.findMany({
      where: {
        slug: {
          in: exerciseSlugs,
        },

        isActive: true,
      },
    });

  const exerciseMap =
    new Map(
      exercises.map((exercise) => [
        exercise.slug,
        exercise,
      ])
    );

  const missingExercises =
    exerciseSlugs.filter(
      (slug) =>
        !exerciseMap.has(slug)
    );

  if (missingExercises.length) {
    throw new Error(
      `Exercícios não encontrados: ${missingExercises.join(
        ", "
      )}`
    );
  }

  const durationWeeks = 6;

  const startedAt =
    new Date();

  const endsAt =
    new Date(startedAt);

  endsAt.setDate(
    endsAt.getDate() +
      durationWeeks * 7
  );

  return prisma.$transaction(
    async (tx) => {
      await tx.trainingProgram.updateMany({
        where: {
          athleteId:
            athlete.id,

          status: "ACTIVE",
        },

        data: {
          status: "CANCELLED",
        },
      });

      const program =
        await tx.trainingProgram.create({
          data: {
            athleteId:
              athlete.id,

            name:
              "Fundação para Performance no BJJ",

            phase:
              recommendation.phase,

            description:
              "Programa inicial para construção de força, estabilidade, cadeia posterior, core e pegada com controle de fadiga para o Jiu-Jitsu.",

            durationWeeks,

            currentWeek: 1,

            status: "ACTIVE",

            recommendedStrengthDays:
              recommendation.recommendedStrengthDays,

            baseRpeMin:
              recommendation.baseRpeMin,

            baseRpeMax:
              recommendation.baseRpeMax,

            startedAt,
            endsAt,

            workouts: {
              create:
                selectedTemplates.map(
                  (
                    workout,
                    workoutIndex
                  ) => ({
                    code:
                      workout.code,

                    name:
                      workout.name,

                    description:
                      workout.description,

                    type:
                      "STRENGTH",

                    order:
                      workoutIndex +
                      1,

                    estimatedDurationMinutes:
                      Math.min(
                        workout.estimatedDurationMinutes,
                        athlete.sessionDurationMinutes
                      ),

                    exercises: {
                      create:
                        workout.exercises.map(
                          (
                            prescription,
                            exerciseIndex
                          ) => {
                            const exercise =
                              exerciseMap.get(
                                prescription.slug
                              );

                            if (
                              !exercise
                            ) {
                              throw new Error(
                                `Exercício ${prescription.slug} não encontrado.`
                              );
                            }

                            return {
                              exerciseId:
                                exercise.id,

                              block:
                                prescription.block,

                              order:
                                exerciseIndex +
                                1,

                              sets:
                                prescription.sets,

                              repsMin:
                                prescription.repsMin,

                              repsMax:
                                prescription.repsMax,

                              durationSeconds:
                                prescription.durationSeconds,

                              distanceMeters:
                                prescription.distanceMeters,

                              restSeconds:
                                prescription.restSeconds,

                              targetRpe:
                                Math.min(
                                  prescription.targetRpe ??
                                    recommendation.baseRpeMax,
                                  recommendation.baseRpeMax
                                ),

                              notes:
                                prescription.notes,
                            };
                          }
                        ),
                    },
                  })
                ),
            },
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
                  },
                },
              },
            },
          },
        });

      return {
        program,
        recommendation,
      };
    }
  );
}