import { prisma } from "@/lib/prisma";

import { evaluateCheckoutSession } from "./checkout-validation";
import {
  getStripeConfig,
  retrieveCheckoutSession,
} from "./stripe";

export type FulfillmentResult =
  | {
      status: "fulfilled";
      purchaseId: string;
    }
  | {
      status: "pending";
    }
  | {
      status: "rejected";
      reason: string;
    };

function isUniqueViolation(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string })
      .code === "P2002"
  );
}

/*
 * Registra a compra de uma sessão de checkout paga.
 *
 * - A sessão é sempre relida no Stripe (fonte da verdade),
 *   nunca confiada no corpo do evento.
 * - Idempotente: a sessão de checkout é única em Purchase.
 *   Reenvio do webhook ou webhook + página de sucesso ao
 *   mesmo tempo resultam em uma única compra.
 * - expectedUserId: usado pela página de sucesso para só
 *   aceitar a sessão do próprio usuário logado.
 *
 * Erros de rede/banco são lançados para o chamador (o
 * webhook responde 500 e o Stripe tenta de novo).
 */
export async function fulfillCheckoutSession(
  checkoutSessionId: string,
  options: {
    expectedUserId?: string;
  } = {}
): Promise<FulfillmentResult> {
  const { priceId } =
    getStripeConfig();

  const session =
    await retrieveCheckoutSession(
      checkoutSessionId
    );

  const evaluation =
    evaluateCheckoutSession(
      session,
      priceId
    );

  if (evaluation.kind !== "paid") {
    return evaluation.kind ===
      "pending"
      ? {
          status: "pending",
        }
      : {
          status: "rejected",
          reason: evaluation.reason,
        };
  }

  const { purchase } = evaluation;

  if (
    options.expectedUserId &&
    options.expectedUserId !==
      purchase.userId
  ) {
    return {
      status: "rejected",
      reason: "sessão de outro usuário",
    };
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: purchase.userId,
      },

      select: {
        id: true,
      },
    });

  if (!user) {
    return {
      status: "rejected",
      reason: "usuário não encontrado",
    };
  }

  try {
    const saved =
      await prisma.purchase.upsert({
        where: {
          stripeCheckoutSessionId:
            purchase.stripeCheckoutSessionId,
        },

        create: {
          ...purchase,
          status: "paid",
          paidAt: new Date(),
        },

        // Já registrada: nada muda.
        update: {},

        select: {
          id: true,
        },
      });

    return {
      status: "fulfilled",
      purchaseId: saved.id,
    };
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    // Outra requisição registrou a mesma sessão no
    // mesmo instante.
    const existing =
      await prisma.purchase.findUnique({
        where: {
          stripeCheckoutSessionId:
            purchase.stripeCheckoutSessionId,
        },

        select: {
          id: true,
        },
      });

    if (!existing) {
      throw error;
    }

    return {
      status: "fulfilled",
      purchaseId: existing.id,
    };
  }
}
