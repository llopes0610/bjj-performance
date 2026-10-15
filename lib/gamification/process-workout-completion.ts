import type { Prisma } from "@/generated/prisma/client";

import { evaluateAchievements } from "@/lib/gamification/evaluate-achievements";
import {
  lockGamificationProfile,
  processWeekCompletion,
} from "@/lib/gamification/process-week-completion";

/**
 * XP concedido por treino prescrito
 * concluído.
 */
export const WORKOUT_COMPLETED_XP = 100;

interface ProcessWorkoutCompletionInput {
  athleteId: string;
  workoutId: string;
  programId: string;
  programWeek: number;

  /**
   * Momento da conclusão da sessão
   * (WorkoutSession.completedAt).
   *
   * Todos os eventos e conquistas gerados
   * aqui recebem esse timestamp, o que
   * permite à tela pós-treino mostrar
   * exatamente o que esta sessão gerou.
   */
  occurredAt: Date;
}

export interface UnlockedAchievement {
  code: string;
  name: string;
  xpReward: number;
}

export interface ProcessWorkoutCompletionResult {
  xpAwarded: number;
  weekCompleted: boolean;
  currentStreak: number;
  unlockedAchievements: UnlockedAchievement[];
}

/**
 * Identidade de um treino prescrito:
 * workoutId + programWeek.
 *
 * Usada como sourceId do evento
 * WORKOUT_COMPLETED. Assim uma sessão extra
 * do mesmo treino na mesma semana não
 * concede XP novamente.
 */
export function getPrescribedWorkoutSourceId(
  workoutId: string,
  programWeek: number
) {
  return `${workoutId}:${programWeek}`;
}

/**
 * Treinos prescritos únicos concluídos
 * (workout + semana do programa).
 */
export async function countCompletedPrescribedWorkouts(
  client: Prisma.TransactionClient,
  athleteId: string
) {
  const groups =
    await client.workoutSession.groupBy({
      by: ["workoutId", "programWeek"],

      where: {
        athleteId,
        status: "COMPLETED",
      },
    });

  return groups.length;
}

/**
 * Efeitos de gamificação derivados de uma
 * WorkoutSession recém concluída:
 *
 * 1. XP do treino prescrito;
 * 2. semana concluída (XP + streak);
 * 3. conquistas.
 *
 * Deve rodar na mesma transação que marca
 * a sessão como COMPLETED. Toda concessão
 * passa pelo ledger (GamificationEvent) ou
 * por AthleteAchievement, ambos únicos,
 * portanto retries não duplicam XP.
 */
export async function processWorkoutCompletion(
  tx: Prisma.TransactionClient,
  {
    athleteId,
    workoutId,
    programId,
    programWeek,
    occurredAt,
  }: ProcessWorkoutCompletionInput
): Promise<ProcessWorkoutCompletionResult> {
  await lockGamificationProfile(
    tx,
    athleteId
  );

  let xpAwarded = 0;

  /*
   * ========================================
   * XP DO TREINO
   * ========================================
   */
  const workoutEvent =
    await tx.gamificationEvent.createMany({
      data: [
        {
          athleteId,
          type: "WORKOUT_COMPLETED",
          sourceType: "WORKOUT_SESSION",
          sourceId:
            getPrescribedWorkoutSourceId(
              workoutId,
              programWeek
            ),
          xp: WORKOUT_COMPLETED_XP,
          description: `Treino concluído (semana ${programWeek})`,
          createdAt: occurredAt,
        },
      ],

      skipDuplicates: true,
    });

  if (workoutEvent.count === 1) {
    xpAwarded += WORKOUT_COMPLETED_XP;

    await tx.gamificationProfile.update({
      where: {
        athleteId,
      },

      data: {
        totalXp: {
          increment:
            WORKOUT_COMPLETED_XP,
        },
      },
    });
  }

  /*
   * ========================================
   * SEMANA / STREAK
   * ========================================
   */
  const week =
    await processWeekCompletion(tx, {
      athleteId,
      programId,
      programWeek,
      occurredAt,
    });

  if (week.status === "PROCESSED") {
    xpAwarded += week.xpAwarded;
  }

  /*
   * ========================================
   * CONQUISTAS
   * ========================================
   */
  const profile =
    await tx.gamificationProfile.findUniqueOrThrow({
      where: {
        athleteId,
      },

      select: {
        currentStreak: true,
      },
    });

  /*
   * Treinos prescritos únicos concluídos.
   * Sessões repetidas do mesmo treino na
   * mesma semana contam uma vez.
   */
  const completedWorkouts =
    await countCompletedPrescribedWorkouts(
      tx,
      athleteId
    );

  const eligibleCodes =
    evaluateAchievements({
      completedWorkouts,
      currentStreak:
        profile.currentStreak,
      hasCompletedProgram:
        week.status === "PROCESSED" &&
        week.programCompleted,
    });

  const unlockedAchievements: UnlockedAchievement[] =
    [];

  if (eligibleCodes.length > 0) {
    const achievements =
      await tx.achievement.findMany({
        where: {
          code: {
            in: eligibleCodes,
          },

          isActive: true,
        },
      });

    for (const achievement of achievements) {
      const unlocked =
        await tx.athleteAchievement.createMany({
          data: [
            {
              athleteId,
              achievementId:
                achievement.id,
              unlockedAt: occurredAt,
            },
          ],

          skipDuplicates: true,
        });

      if (unlocked.count === 0) {
        continue;
      }

      const event =
        await tx.gamificationEvent.createMany({
          data: [
            {
              athleteId,
              type: "ACHIEVEMENT_UNLOCKED",
              sourceType: "ACHIEVEMENT",
              sourceId: achievement.id,
              xp: achievement.xpReward,
              description: `Conquista: ${achievement.name}`,
              createdAt: occurredAt,
            },
          ],

          skipDuplicates: true,
        });

      if (
        event.count === 1 &&
        achievement.xpReward > 0
      ) {
        xpAwarded +=
          achievement.xpReward;

        await tx.gamificationProfile.update({
          where: {
            athleteId,
          },

          data: {
            totalXp: {
              increment:
                achievement.xpReward,
            },
          },
        });
      }

      unlockedAchievements.push({
        code: achievement.code,
        name: achievement.name,
        xpReward:
          achievement.xpReward,
      });
    }
  }

  return {
    xpAwarded,
    weekCompleted:
      week.status !==
      "WEEK_NOT_COMPLETED",
    currentStreak:
      profile.currentStreak,
    unlockedAchievements,
  };
}
