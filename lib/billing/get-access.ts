import { prisma } from "@/lib/prisma";

import {
  isBillingEnabled,
  PAID_PURCHASE_STATUS,
} from "./access";

/*
 * Diz se o usuário (pelo e-mail da sessão autenticada)
 * comprou o BJJ Performance. Com a cobrança desligada,
 * sempre libera.
 */
export async function userHasAccess(
  email: string
) {
  if (!isBillingEnabled()) {
    return true;
  }

  const purchase =
    await prisma.purchase.findFirst({
      where: {
        status: PAID_PURCHASE_STATUS,

        user: {
          email,
        },
      },

      select: {
        id: true,
      },
    });

  return purchase !== null;
}

export function paymentRequiredResponseBody() {
  return {
    error:
      "Você ainda não tem acesso ao BJJ Performance. Compre o acesso para continuar.",
    code: "PAYMENT_REQUIRED",
  };
}
