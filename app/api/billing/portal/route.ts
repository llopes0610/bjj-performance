import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAppUrl } from "@/lib/billing/app-url";
import { createBillingPortalSession } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";

/*
 * Abre o portal do cliente do Stripe (trocar cartão,
 * cancelar, ver faturas).
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
    const subscription =
      await prisma.subscription.findFirst({
        where: {
          user: {
            email:
              session.user.email,
          },
        },

        select: {
          stripeCustomerId: true,
        },
      });

    if (!subscription) {
      return NextResponse.json(
        {
          error:
            "Nenhuma assinatura encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const portal =
      await createBillingPortalSession({
        customerId:
          subscription.stripeCustomerId,
        returnUrl: `${getAppUrl(request)}/profile`,
      });

    return NextResponse.json({
      url: portal.url,
    });
  } catch (error) {
    console.error(
      "BILLING_PORTAL_ERROR",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível abrir o gerenciamento da assinatura.",
      },
      {
        status: 500,
      }
    );
  }
}
