import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/gamification/calculate-level";
import { getPrescribedWorkoutSourceId } from "@/lib/gamification/process-workout-completion";

export type SessionRewardType =
  | "WORKOUT"
  | "WEEK"
  | "ACHIEVEMENT";

export interface SessionReward {
  type: SessionRewardType;
  label: string;
  xp: number;
}

/**
 * Recompensas geradas por uma sessão
 * concluída.
 *
 * Lê somente o ledger do servidor:
 * processWorkoutCompletion grava todos os
 * eventos da sessão com createdAt igual a
 * WorkoutSession.completedAt.
 *
 * Nada aqui concede XP.
 */
export async function getSessionGamification({
  athleteId,
  workoutId,
  programWeek,
  completedAt,
}: {
  athleteId: string;
  workoutId: string;
  programWeek: number;
  completedAt: Date | null;
}) {
  const [events, profile] =
    await Promise.all([
      completedAt
        ? prisma.gamificationEvent.findMany({
            where: {
              athleteId,
              createdAt: completedAt,
              type: {
                in: [
                  "WORKOUT_COMPLETED",
                  "WEEK_COMPLETED",
                  "ACHIEVEMENT_UNLOCKED",
                ],
              },
            },

            orderBy: {
              xp: "asc",
            },
          })
        : Promise.resolve([]),

      prisma.gamificationProfile.findUnique({
        where: {
          athleteId,
        },

        select: {
          totalXp: true,
          currentStreak: true,
        },
      }),
    ]);

  const achievementIds = events
    .filter(
      (event) =>
        event.type ===
        "ACHIEVEMENT_UNLOCKED"
    )
    .map((event) => event.sourceId);

  const achievements =
    achievementIds.length > 0
      ? await prisma.achievement.findMany({
          where: {
            id: {
              in: achievementIds,
            },
          },

          select: {
            id: true,
            name: true,
          },
        })
      : [];

  const achievementNames = new Map(
    achievements.map((achievement) => [
      achievement.id,
      achievement.name,
    ])
  );

  const rewards: SessionReward[] =
    events.map((event) => {
      switch (event.type) {
        case "WORKOUT_COMPLETED":
          return {
            type: "WORKOUT",
            label: "Treino concluído",
            xp: event.xp,
          };

        case "WEEK_COMPLETED":
          return {
            type: "WEEK",
            label: "Semana concluída",
            xp: event.xp,
          };

        default:
          return {
            type: "ACHIEVEMENT",
            label:
              achievementNames.get(
                event.sourceId
              ) ?? "Conquista",
            xp: event.xp,
          };
      }
    });

  /*
   * Ordem de exibição: treino, semana,
   * conquistas.
   */
  const order: Record<
    SessionRewardType,
    number
  > = {
    WORKOUT: 0,
    WEEK: 1,
    ACHIEVEMENT: 2,
  };

  rewards.sort(
    (a, b) =>
      order[a.type] - order[b.type]
  );

  const totalXp =
    profile?.totalXp ?? 0;

  /*
   * Sessão extra: o treino prescrito desta
   * semana já gerou XP em outra sessão.
   */
  const alreadyRewarded =
    rewards.length === 0 &&
    (await prisma.gamificationEvent.count({
      where: {
        athleteId,
        type: "WORKOUT_COMPLETED",
        sourceId:
          getPrescribedWorkoutSourceId(
            workoutId,
            programWeek
          ),
      },
    })) > 0;

  return {
    rewards,

    xpEarned: rewards.reduce(
      (total, reward) =>
        total + reward.xp,
      0
    ),

    alreadyRewarded,

    weekCompleted: rewards.some(
      (reward) =>
        reward.type === "WEEK"
    ),

    currentStreak:
      profile?.currentStreak ?? 0,

    level: calculateLevel(totalXp),
  };
}
