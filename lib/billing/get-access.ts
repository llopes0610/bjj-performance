import { prisma } from "@/lib/prisma";

import {
  hasActiveAccess,
  isBillingEnabled,
} from "./access";

/*
 * Diz se o usuário (pelo e-mail da sessão) pode usar as
 * partes pagas do app. Com a cobrança desligada, sempre
 * libera.
 */
export async function userHasAccess(
  email: string
) {
  if (!isBillingEnabled()) {
    return true;
  }

  const subscription =
    await prisma.subscription.findFirst({
      where: {
        user: {
          email,
        },
      },

      select: {
        status: true,
        currentPeriodEnd: true,
      },
    });

  return hasActiveAccess(subscription);
}

export function paymentRequiredResponseBody() {
  return {
    error:
      "Sua assinatura não está ativa. Assine para continuar.",
    code: "PAYMENT_REQUIRED",
  };
}
