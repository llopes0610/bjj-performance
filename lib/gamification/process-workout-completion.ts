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
  /*
   * Cada consulta aqui é uma ida ao banco
   * dentro da transação (que segura o lock
   * do perfil). Por isso as gravações no
   * GamificationProfile são acumuladas e
   * aplicadas em um único update no fim.
   */
  const profile =
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
      profile,
    });

  let currentStreak =
    profile.currentStreak;

  if (week.status === "PROCESSED") {
    xpAwarded += week.xpAwarded;
    currentStreak =
      week.streak.currentStreak;
  }

  /*
   * ========================================
   * CONQUISTAS
   * ========================================
   */

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
      currentStreak,
      hasCompletedProgram:
        week.status === "PROCESSED" &&
        week.programCompleted,
    });

  const unlockedAchievements: UnlockedAchievement[] =
    [];

  if (eligibleCodes.length > 0) {
    /*
     * Somente conquistas elegíveis que o
     * atleta ainda não possui.
     */
    const pending =
      await tx.achievement.findMany({
        where: {
          code: {
            in: eligibleCodes,
          },

          isActive: true,

          athleteAchievements: {
            none: {
              athleteId,
            },
          },
        },
      });

    if (pending.length > 0) {
      /*
       * skipDuplicates + RETURNING:
       * só retornam as linhas realmente
       * inseridas nesta transação.
       */
      const inserted =
        await tx.athleteAchievement.createManyAndReturn({
          data: pending.map(
            (achievement) => ({
              athleteId,
              achievementId:
                achievement.id,
              unlockedAt: occurredAt,
            })
          ),

          skipDuplicates: true,

          select: {
            achievementId: true,
          },
        });

      const insertedIds = new Set(
        inserted.map(
          (item) => item.achievementId
        )
      );

      const newlyUnlocked =
        pending.filter((achievement) =>
          insertedIds.has(achievement.id)
        );

      if (newlyUnlocked.length > 0) {
        const events =
          await tx.gamificationEvent.createManyAndReturn({
            data: newlyUnlocked.map(
              (achievement) => ({
                athleteId,
                type: "ACHIEVEMENT_UNLOCKED" as const,
                sourceType: "ACHIEVEMENT" as const,
                sourceId: achievement.id,
                xp: achievement.xpReward,
                description: `Conquista: ${achievement.name}`,
                createdAt: occurredAt,
              })
            ),

            skipDuplicates: true,

            select: {
              xp: true,
            },
          });

        xpAwarded += events.reduce(
          (total, event) =>
            total + event.xp,
          0
        );
      }

      unlockedAchievements.push(
        ...newlyUnlocked.map(
          (achievement) => ({
            code: achievement.code,
            name: achievement.name,
            xpReward:
              achievement.xpReward,
          })
        )
      );
    }
  }

  /*
   * ========================================
   * PERFIL (ÚNICO UPDATE)
   * ========================================
   */
  const streakChanged =
    week.status === "PROCESSED" &&
    week.streak.changed;

  if (xpAwarded > 0 || streakChanged) {
    await tx.gamificationProfile.update({
      where: {
        athleteId,
      },

      data: {
        totalXp: {
          increment: xpAwarded,
        },

        ...(streakChanged
          ? {
              currentStreak:
                week.streak.currentStreak,
              longestStreak:
                week.streak.longestStreak,
              lastCompletedProgramId:
                week.streak
                  .lastCompletedProgramId,
              lastCompletedWeek:
                week.streak
                  .lastCompletedWeek,
            }
          : {}),
      },
    });
  }

  return {
    xpAwarded,
    weekCompleted:
      week.status !==
      "WEEK_NOT_COMPLETED",
    currentStreak,
    unlockedAchievements,
  };
}
