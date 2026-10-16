import type { StripeCheckoutSession } from "./stripe";

/*
 * Decide se uma sessão de checkout do Stripe representa uma
 * compra paga do BJJ Performance. Função pura: recebe a
 * sessão já lida do Stripe (com line_items) e o preço
 * esperado.
 */

export interface PurchaseData {
  userId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  stripePriceId: string;
  amountTotal: number;
  currency: string;
}

export type CheckoutEvaluation =
  | {
      kind: "paid";
      purchase: PurchaseData;
    }
  | {
      // Pagamento assíncrono ainda não confirmado: o
      // Stripe avisa depois com async_payment_succeeded.
      kind: "pending";
    }
  | {
      kind: "rejected";
      reason: string;
    };

export function evaluateCheckoutSession(
  session: StripeCheckoutSession,
  expectedPriceId: string
): CheckoutEvaluation {
  if (session.mode !== "payment") {
    return {
      kind: "rejected",
      reason: `mode=${session.mode}`,
    };
  }

  const userId =
    session.client_reference_id;

  const metadataUserId =
    session.metadata?.userId;

  if (
    !userId ||
    (metadataUserId &&
      metadataUserId !== userId)
  ) {
    return {
      kind: "rejected",
      reason: "usuário ausente ou divergente",
    };
  }

  const items =
    session.line_items?.data ?? [];

  const priceItem = items.find(
    (item) =>
      item.price?.id ===
      expectedPriceId
  );

  if (!priceItem) {
    return {
      kind: "rejected",
      reason: "preço diferente do STRIPE_PRICE_ID",
    };
  }

  if (
    session.payment_status ===
    "unpaid"
  ) {
    return {
      kind: "pending",
    };
  }

  if (
    session.payment_status !==
    "paid"
  ) {
    return {
      kind: "rejected",
      reason: `payment_status=${session.payment_status}`,
    };
  }

  if (
    typeof session.amount_total !==
      "number" ||
    !session.currency
  ) {
    return {
      kind: "rejected",
      reason: "valor ausente",
    };
  }

  const paymentIntent =
    session.payment_intent;

  return {
    kind: "paid",

    purchase: {
      userId,
      stripeCheckoutSessionId:
        session.id,
      stripePaymentIntentId:
        typeof paymentIntent ===
        "string"
          ? paymentIntent
          : paymentIntent?.id ?? null,
      stripeCustomerId:
        session.customer,
      stripePriceId:
        expectedPriceId,
      amountTotal:
        session.amount_total,
      currency: session.currency,
    },
  };
}
