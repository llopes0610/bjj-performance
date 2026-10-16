import { NextResponse } from "next/server";

import { fulfillCheckoutSession } from "@/lib/billing/fulfill-checkout";
import { verifyStripeSignature } from "@/lib/billing/stripe-signature";
import { prisma } from "@/lib/prisma";

/*
 * Webhook do Stripe para a compra única do BJJ Performance.
 *
 * - O corpo é lido cru para validar Stripe-Signature.
 * - Cada evento é processado uma vez (StripeWebhookEvent) e
 *   a compra é única por sessão de checkout (Purchase).
 * - A sessão é relida no Stripe antes de liberar acesso:
 *   mode=payment, payment_status=paid, preço esperado e
 *   usuário existente.
 * - Erro de rede ou banco responde 500 para o Stripe tentar
 *   de novo; sessão inválida responde 200 (repetir não muda
 *   o resultado) e fica no log.
 */

// Pagamento confirmado: libera acesso.
const FULFILLMENT_EVENTS = new Set([
  "checkout.session.completed",
  // Só ocorre com métodos assíncronos (Pix, boleto).
  "checkout.session.async_payment_succeeded",
]);

// Pagamento assíncrono recusado: apenas registramos.
const FAILED_PAYMENT_EVENT =
  "checkout.session.async_payment_failed";

interface StripeEvent {
  id: string;
  type: string;
  livemode?: boolean;
  data: {
    object: {
      id?: string;
      object?: string;
    };
  };
}

async function markProcessed(
  event: StripeEvent
) {
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

  if (
    !FULFILLMENT_EVENTS.has(event.type) &&
    event.type !== FAILED_PAYMENT_EVENT
  ) {
    // Evento que não usamos: confirmamos o recebimento.
    return NextResponse.json({
      received: true,
      ignored: true,
    });
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

  const checkoutSessionId =
    event.data.object.object ===
    "checkout.session"
      ? event.data.object.id
      : undefined;

  if (!checkoutSessionId) {
    console.warn(
      "STRIPE_WEBHOOK_WITHOUT_SESSION",
      event.type,
      event.id
    );

    await markProcessed(event);

    return NextResponse.json({
      received: true,
      ignored: true,
    });
  }

  if (
    event.type ===
    FAILED_PAYMENT_EVENT
  ) {
    console.warn(
      "STRIPE_ASYNC_PAYMENT_FAILED",
      checkoutSessionId
    );

    await markProcessed(event);

    return NextResponse.json({
      received: true,
    });
  }

  try {
    const result =
      await fulfillCheckoutSession(
        checkoutSessionId
      );

    if (result.status === "rejected") {
      console.warn(
        "STRIPE_CHECKOUT_REJECTED",
        checkoutSessionId,
        result.reason
      );
    }

    // "pending": pagamento assíncrono ainda não confirmado.
    // O Stripe envia async_payment_succeeded depois (outro
    // evento, outro id), então este pode ser marcado.
    await markProcessed(event);

    return NextResponse.json({
      received: true,
      result: result.status,
    });
  } catch (error) {
    console.error(
      "STRIPE_WEBHOOK_ERROR",
      event.type,
      event.id,
      error instanceof Error
        ? error.message
        : error
    );

    // Não marcado como processado: o Stripe reenvia.
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
