import { achievementCatalog } from "@/data/achievements/catalog";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/gamification/calculate-level";
import {
  getAchievementProgress,
  type AchievementProgress,
} from "@/lib/gamification/evaluate-achievements";
import { countCompletedPrescribedWorkouts } from "@/lib/gamification/process-workout-completion";

const RECENT_EVENTS_LIMIT = 10;

/**
 * Dados da página de progresso.
 *
 * Somente leitura: tudo vem do
 * GamificationProfile, do ledger e de
 * AthleteAchievement.
 */
export async function getProgressData(
  athleteId: string
) {
  const [
    profile,
    achievements,
    unlocked,
    recentEvents,
    completedWorkouts,
  ] = await Promise.all([
    prisma.gamificationProfile.findUnique({
      where: {
        athleteId,
      },

      select: {
        totalXp: true,
        currentStreak: true,
        longestStreak: true,
      },
    }),

    prisma.achievement.findMany({
      where: {
        isActive: true,
      },

      orderBy: [
        {
          category: "asc",
        },
        {
          xpReward: "asc",
        },
      ],
    }),

    prisma.athleteAchievement.findMany({
      where: {
        athleteId,
      },

      select: {
        achievementId: true,
        unlockedAt: true,
        achievement: {
          select: {
            code: true,
          },
        },
      },
    }),

    prisma.gamificationEvent.findMany({
      where: {
        athleteId,
      },

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          xp: "desc",
        },
      ],

      take: RECENT_EVENTS_LIMIT,

      select: {
        id: true,
        type: true,
        xp: true,
        description: true,
        createdAt: true,
      },
    }),

    countCompletedPrescribedWorkouts(
      prisma,
      athleteId
    ),
  ]);

  const totalXp =
    profile?.totalXp ?? 0;

  const currentStreak =
    profile?.currentStreak ?? 0;

  const unlockedAtById = new Map(
    unlocked.map((item) => [
      item.achievementId,
      item.unlockedAt,
    ])
  );

  const stats = {
    completedWorkouts,
    currentStreak,
    hasCompletedProgram:
      unlocked.some(
        (item) =>
          item.achievement.code ===
          "FIRST_PROGRAM"
      ),
  };

  const rulesByCode = new Map<
    string,
    (typeof achievementCatalog)[number]["rule"]
  >(
    achievementCatalog.map(
      (achievement) => [
        achievement.code,
        achievement.rule,
      ]
    )
  );

  const achievementItems =
    achievements.map((achievement) => {
      const unlockedAt =
        unlockedAtById.get(
          achievement.id
        ) ?? null;

      const rule = rulesByCode.get(
        achievement.code
      );

      const progress:
        | AchievementProgress
        | null =
        !unlockedAt && rule
          ? getAchievementProgress(
              rule,
              stats
            )
          : null;

      return {
        id: achievement.id,
        code: achievement.code,
        name: achievement.name,
        description:
          achievement.description,
        category: achievement.category,
        xpReward: achievement.xpReward,
        unlockedAt,
        progress,
      };
    });

  return {
    level: calculateLevel(totalXp),
    currentStreak,
    longestStreak:
      profile?.longestStreak ?? 0,
    completedWorkouts,
    achievements: achievementItems,
    achievementsUnlocked:
      achievementItems.filter(
        (item) => item.unlockedAt
      ).length,
    recentEvents,
  };
}

export type ProgressData = Awaited<
  ReturnType<typeof getProgressData>
>;
