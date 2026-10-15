import type { Prisma } from "@/generated/prisma/client";

import {
  calculateWeeklyStreak,
  type WeeklyStreakResult,
} from "@/lib/gamification/calculate-streak";

/**
 * XP concedido quando todos os treinos
 * prescritos de uma semana são concluídos.
 */
export const WEEK_COMPLETED_XP = 150;

interface ProcessWeekCompletionInput {
  athleteId: string;
  programId: string;
  programWeek: number;

  /**
   * Momento da conclusão da sessão.
   * Gravado como createdAt do evento para
   * vincular o XP à sessão que o gerou.
   */
  occurredAt: Date;
}

export type ProcessWeekCompletionResult =
  | {
      status: "WEEK_NOT_COMPLETED";
    }
  | {
      status: "ALREADY_PROCESSED";
    }
  | {
      status: "PROCESSED";
      xpAwarded: number;
      streak: WeeklyStreakResult;

      /**
       * true quando esta é a semana final
       * do programa.
       */
      programCompleted: boolean;
    };

/**
 * Identidade da semana:
 * programId + programWeek.
 */
export function getProgramWeekSourceId(
  programId: string,
  programWeek: number
) {
  return `${programId}:${programWeek}`;
}

/**
 * Garante que o GamificationProfile existe
 * e bloqueia sua linha (FOR UPDATE) até o
 * fim da transação.
 *
 * Deve ser chamada antes de qualquer
 * leitura de fatos de treino usada para
 * conceder XP, streak ou conquistas.
 */
export async function lockGamificationProfile(
  tx: Prisma.TransactionClient,
  athleteId: string
) {
  /*
   * GamificationProfile pode ainda não
   * existir para o atleta.
   *
   * skipDuplicates evita erro de constraint
   * (que abortaria a transação no Postgres)
   * quando o perfil já existe.
   */
  await tx.gamificationProfile.createMany({
    data: [
      {
        athleteId,
      },
    ],

    skipDuplicates: true,
  });

  /*
   * O lock vem ANTES da verificação dos
   * fatos de treino.
   *
   * Se dois treinos da mesma semana forem
   * finalizados ao mesmo tempo, a segunda
   * transação espera a primeira e, ao
   * continuar, enxerga a sessão já
   * concluída por ela.
   */
  await tx.$queryRaw`
    SELECT "id"
    FROM "GamificationProfile"
    WHERE "athleteId" = ${athleteId}
    FOR UPDATE
  `;
}

/**
 * Processa a conclusão de uma semana de
 * programa.
 *
 * Deve ser executada dentro da mesma
 * transação que marca a WorkoutSession
 * como COMPLETED.
 *
 * Pré-requisito: o chamador já executou
 * lockGamificationProfile() nesta
 * transação.
 *
 * Idempotência:
 *
 * 1. a linha do GamificationProfile é
 *    bloqueada (FOR UPDATE), serializando
 *    finalizações concorrentes do atleta;
 * 2. o evento WEEK_COMPLETED só é criado
 *    uma vez por athleteId + programId +
 *    programWeek (constraint única);
 * 3. a engine de streak ignora semanas já
 *    processadas.
 */
export async function processWeekCompletion(
  tx: Prisma.TransactionClient,
  {
    athleteId,
    programId,
    programWeek,
    occurredAt,
  }: ProcessWeekCompletionInput
): Promise<ProcessWeekCompletionResult> {
  /*
   * Semana completa = todos os workouts
   * realmente prescritos no programa
   * possuem uma sessão COMPLETED do atleta
   * nesta programWeek.
   */
  const program =
    await tx.trainingProgram.findFirst({
      where: {
        id: programId,
        athleteId,
      },

      select: {
        durationWeeks: true,

        workouts: {
          select: {
            sessions: {
              where: {
                athleteId,
                programWeek,
                status: "COMPLETED",
              },

              select: {
                id: true,
              },

              take: 1,
            },
          },
        },
      },
    });

  const weekCompleted =
    !!program &&
    program.workouts.length > 0 &&
    program.workouts.every(
      (workout) =>
        workout.sessions.length > 0
    );

  if (!program || !weekCompleted) {
    return {
      status: "WEEK_NOT_COMPLETED",
    };
  }

  /*
   * Ledger: o evento da semana só pode
   * existir uma vez.
   */
  const event =
    await tx.gamificationEvent.createMany({
      data: [
        {
          athleteId,
          type: "WEEK_COMPLETED",
          sourceType: "PROGRAM_WEEK",
          sourceId:
            getProgramWeekSourceId(
              programId,
              programWeek
            ),
          xp: WEEK_COMPLETED_XP,
          description: `Semana ${programWeek} concluída`,
          createdAt: occurredAt,
        },
      ],

      skipDuplicates: true,
    });

  if (event.count === 0) {
    return {
      status: "ALREADY_PROCESSED",
    };
  }

  const profile =
    await tx.gamificationProfile.findUniqueOrThrow({
      where: {
        athleteId,
      },
    });

  /*
   * Continuidade entre programas:
   *
   * só é permitida quando a última semana
   * registrada foi a semana final do
   * programa anterior.
   *
   * Não dependemos de status COMPLETED,
   * porque ao gerar um novo programa o
   * anterior é marcado como CANCELLED.
   */
  let previousProgramCompleted = false;

  if (
    profile.lastCompletedProgramId &&
    profile.lastCompletedWeek !== null &&
    profile.lastCompletedProgramId !==
      programId
  ) {
    const previousProgram =
      await tx.trainingProgram.findFirst({
        where: {
          id: profile.lastCompletedProgramId,
          athleteId,
        },

        select: {
          durationWeeks: true,
        },
      });

    previousProgramCompleted =
      !!previousProgram &&
      profile.lastCompletedWeek >=
        previousProgram.durationWeeks;
  }

  const streak =
    calculateWeeklyStreak({
      currentStreak:
        profile.currentStreak,
      longestStreak:
        profile.longestStreak,
      currentProgramId: programId,
      completedWeek: programWeek,
      lastCompletedProgramId:
        profile.lastCompletedProgramId,
      lastCompletedWeek:
        profile.lastCompletedWeek,
      previousProgramCompleted,
    });

  await tx.gamificationProfile.update({
    where: {
      athleteId,
    },

    data: {
      totalXp: {
        increment: WEEK_COMPLETED_XP,
      },

      ...(streak.changed
        ? {
            currentStreak:
              streak.currentStreak,
            longestStreak:
              streak.longestStreak,
            lastCompletedProgramId:
              streak.lastCompletedProgramId,
            lastCompletedWeek:
              streak.lastCompletedWeek,
          }
        : {}),
    },
  });

  return {
    status: "PROCESSED",
    xpAwarded: WEEK_COMPLETED_XP,
    streak,
    programCompleted:
      programWeek >=
      program.durationWeeks,
  };
}
