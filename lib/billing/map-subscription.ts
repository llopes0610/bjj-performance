import type { StripeSubscription } from "./stripe";

export interface SubscriptionSnapshot {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/*
 * Converte a assinatura do Stripe nos campos que guardamos.
 */
export function mapStripeSubscription(
  subscription: StripeSubscription
): SubscriptionSnapshot {
  const item =
    subscription.items?.data?.[0];

  const periodEnd =
    subscription.current_period_end ??
    item?.current_period_end ??
    null;

  return {
    stripeCustomerId:
      subscription.customer,
    stripeSubscriptionId:
      subscription.id,
    stripePriceId:
      item?.price?.id ?? null,
    status: subscription.status,
    currentPeriodEnd:
      typeof periodEnd === "number"
        ? new Date(periodEnd * 1000)
        : null,
    cancelAtPeriodEnd: Boolean(
      subscription.cancel_at_period_end
    ),
  };
}
