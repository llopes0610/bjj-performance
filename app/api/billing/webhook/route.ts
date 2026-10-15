import { NextResponse } from "next/server";

import { verifyStripeSignature } from "@/lib/billing/stripe-signature";
import { syncStripeSubscription } from "@/lib/billing/subscription-sync";
import { prisma } from "@/lib/prisma";

/*
 * Webhook do Stripe. Única fonte, junto da sincronização
 * pós-checkout, que altera o status das assinaturas.
 *
 * - O corpo é lido cru para validar Stripe-Signature.
 * - Cada evento é processado uma vez (StripeWebhookEvent).
 * - O status é relido do Stripe, então a ordem dos eventos
 *   não importa.
 */

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);

const INVOICE_EVENTS = new Set([
  "invoice.paid",
  "invoice.payment_failed",
]);

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      object?: string;
      subscription?:
        | string
        | null
        | {
            id: string;
          };
      parent?: {
        subscription_details?: {
          subscription?: string | null;
        } | null;
      } | null;
    };
  };
}

function getSubscriptionId(
  event: StripeEvent
): string | null {
  const object = event.data.object;

  if (
    SUBSCRIPTION_EVENTS.has(
      event.type
    )
  ) {
    return object.id ?? null;
  }

  if (
    event.type ===
      "checkout.session.completed" ||
    INVOICE_EVENTS.has(event.type)
  ) {
    const subscription =
      object.subscription;

    if (typeof subscription === "string") {
      return subscription;
    }

    if (subscription?.id) {
      return subscription.id;
    }

    // Faturas nas versões novas da API.
    return (
      object.parent
        ?.subscription_details
        ?.subscription ?? null
    );
  }

  return null;
}

export async function POST(
  request: Request
) {
  const secret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET não está definida."
    );

    return NextResponse.json(
      {
        error:
          "Webhook não configurado.",
      },
      {
        status: 500,
      }
    );
  }

  const payload =
    await request.text();

  const valid = verifyStripeSignature({
    payload,
    header: request.headers.get(
      "stripe-signature"
    ),
    secret,
  });

  if (!valid) {
    return NextResponse.json(
      {
        error: "Assinatura inválida.",
      },
      {
        status: 400,
      }
    );
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json(
      {
        error: "Corpo inválido.",
      },
      {
        status: 400,
      }
    );
  }

  const alreadyProcessed =
    await prisma.stripeWebhookEvent.findUnique({
      where: {
        id: event.id,
      },

      select: {
        id: true,
      },
    });

  if (alreadyProcessed) {
    return NextResponse.json({
      received: true,
      duplicate: true,
    });
  }

  try {
    const subscriptionId =
      getSubscriptionId(event);

    if (subscriptionId) {
      await syncStripeSubscription(
        subscriptionId
      );
    }

    // Registrado só depois do sucesso: se falhar, o
    // Stripe reenvia e tentamos de novo.
    await prisma.stripeWebhookEvent.upsert({
      where: {
        id: event.id,
      },

      create: {
        id: event.id,
        type: event.type,
      },

      update: {},
    });

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "STRIPE_WEBHOOK_ERROR",
      event.type,
      event.id,
      error
    );

    return NextResponse.json(
      {
        error:
          "Falha ao processar o evento.",
      },
      {
        status: 500,
      }
    );
  }
}
