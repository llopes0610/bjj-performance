import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  processWorkoutCompletion,
  type ProcessWorkoutCompletionResult,
} from "@/lib/gamification/process-workout-completion";

interface CompleteWorkoutSessionInput {
  session: {
    id: string;
    athleteId: string;
    workoutId: string;
    programId: string;
    programWeek: number;
  };

  completedAt: Date;

  /**
   * Feedback pós-treino e duração,
   * gravados junto com o status.
   */
  data: Omit<
    Prisma.WorkoutSessionUpdateManyMutationInput,
    "status" | "completedAt"
  >;
}

/**
 * Conclui uma WorkoutSession e aplica os
 * efeitos de gamificação na mesma
 * transação.
 *
 * Retorna null quando a sessão não estava
 * mais IN_PROGRESS (retry ou duplo clique
 * concorrente).
 *
 * Usado pela rota de finalização e pelo
 * script de QA, para que ambos exercitem
 * exatamente o mesmo caminho.
 */
export async function completeWorkoutSession({
  session,
  completedAt,
  data,
}: CompleteWorkoutSessionInput): Promise<ProcessWorkoutCompletionResult | null> {
  return prisma.$transaction(
    async (tx) => {
      /*
       * Update condicional:
       * um retry/duplo clique
       * concorrente não finaliza a
       * mesma sessão duas vezes.
       */
      const updated =
        await tx.workoutSession.updateMany({
          where: {
            id: session.id,
            status: "IN_PROGRESS",
          },

          data: {
            ...data,
            status: "COMPLETED",
            completedAt,
          },
        });

      if (updated.count !== 1) {
        return null;
      }

      return processWorkoutCompletion(
        tx,
        {
          athleteId: session.athleteId,
          workoutId: session.workoutId,
          programId: session.programId,
          programWeek:
            session.programWeek,
          occurredAt: completedAt,
        }
      );
    }
  );
}
