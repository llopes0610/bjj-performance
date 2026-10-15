import { prisma } from "@/lib/prisma";

import { mapStripeSubscription } from "./map-subscription";
import { retrieveStripeSubscription } from "./stripe";

/*
 * Busca a versão atual da assinatura no Stripe e grava no
 * banco. Ler sempre do Stripe (em vez de confiar no corpo
 * do evento) evita aplicar eventos fora de ordem.
 *
 * O registro é localizado pelo cliente do Stripe, criado
 * no checkout junto com a linha de Subscription.
 */
export async function syncStripeSubscription(
  subscriptionId: string
) {
  const subscription =
    await retrieveStripeSubscription(
      subscriptionId
    );

  const snapshot =
    mapStripeSubscription(subscription);

  const existing =
    await prisma.subscription.findUnique({
      where: {
        stripeCustomerId:
          snapshot.stripeCustomerId,
      },

      select: {
        id: true,
      },
    });

  if (!existing) {
    console.warn(
      "STRIPE_SYNC_UNKNOWN_CUSTOMER",
      snapshot.stripeCustomerId
    );

    return null;
  }

  return prisma.subscription.update({
    where: {
      id: existing.id,
    },

    data: {
      stripeSubscriptionId:
        snapshot.stripeSubscriptionId,
      stripePriceId:
        snapshot.stripePriceId,
      status: snapshot.status,
      currentPeriodEnd:
        snapshot.currentPeriodEnd,
      cancelAtPeriodEnd:
        snapshot.cancelAtPeriodEnd,
    },
  });
}
