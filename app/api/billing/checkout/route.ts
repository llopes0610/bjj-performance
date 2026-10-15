import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasActiveAccess } from "@/lib/billing/access";
import { getAppUrl } from "@/lib/billing/app-url";
import {
  createStripeCustomer,
  createSubscriptionCheckout,
  getStripeConfig,
  StripeConfigError,
} from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

/*
 * Cria a sessão de checkout do Stripe para a assinatura
 * mensal e devolve a URL para o navegador abrir.
 */
export async function POST(
  request: Request
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        error: "Não autorizado.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const { priceId } =
      getStripeConfig();

    const user =
      await prisma.user.findUnique({
        where: {
          email:
            session.user.email,
        },

        select: {
          id: true,
          email: true,
          name: true,
          subscription: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Usuário não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      hasActiveAccess(
        user.subscription
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Sua assinatura já está ativa.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Um cliente do Stripe por usuário. A linha de
     * Subscription nasce aqui, com status "incomplete",
     * e o webhook a atualiza depois do pagamento.
     */
    let customerId =
      user.subscription
        ?.stripeCustomerId;

    if (!customerId) {
      const customer =
        await createStripeCustomer({
          email: user.email,
          name: user.name,
          userId: user.id,
        });

      customerId = customer.id;

      await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId:
            customerId,
        },
      });
    }

    const appUrl =
      getAppUrl(request);

    const checkout =
      await createSubscriptionCheckout({
        customerId,
        userId: user.id,
        priceId,
        successUrl: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/plans`,
      });

    if (!checkout.url) {
      throw new Error(
        "O Stripe não retornou a URL do checkout."
      );
    }

    return NextResponse.json({
      url: checkout.url,
    });
  } catch (error) {
    console.error(
      "BILLING_CHECKOUT_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          StripeConfigError
            ? "Pagamentos ainda não estão configurados."
            : "Não foi possível abrir o pagamento.",
      },
      {
        status: 500,
      }
    );
  }
}
