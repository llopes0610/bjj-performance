import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/billing/access";
import { getAppUrl } from "@/lib/billing/app-url";
import {
  createPaymentCheckout,
  getStripeConfig,
  StripeConfigError,
} from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

/*
 * Cria o Checkout do Stripe para a compra única do BJJ
 * Performance e devolve a URL para o navegador abrir.
 *
 * O usuário é sempre o da sessão autenticada no servidor;
 * nada do corpo da requisição é usado.
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

          purchases: {
            select: {
              status: true,
            },
          },
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
      hasPaidAccess(user.purchases)
    ) {
      return NextResponse.json(
        {
          error:
            "Você já tem acesso ao BJJ Performance.",
        },
        {
          status: 409,
        }
      );
    }

    const appUrl =
      getAppUrl(request);

    const checkout =
      await createPaymentCheckout({
        userId: user.id,
        email: user.email,
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
      error instanceof Error
        ? error.message
        : error
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
