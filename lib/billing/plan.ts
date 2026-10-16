import {
  retrieveStripePrice,
  StripeConfigError,
} from "./stripe";

/*
 * Oferta do BJJ Performance: pagamento único com acesso
 * permanente. O valor exibido vem do Price no Stripe
 * (STRIPE_PRICE_ID), que é a fonte da verdade.
 */
export const PRODUCT_OFFER = {
  name: "BJJ Performance",
  paymentLabel: "Pagamento único",

  features: [
    "Programa de preparação física individual para o seu Jiu-Jitsu",
    "Progressão semanal automática de cargas e volume",
    "Vídeos de execução de todos os exercícios",
    "Ajustes por restrições e dores",
    "Histórico, evolução, níveis e conquistas",
  ],
} as const;

export function formatMoney(
  amountInCents: number,
  currency: string
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: currency.toUpperCase(),
    }
  ).format(amountInCents / 100);
}

/*
 * Preço formatado (ex.: "R$ 97,90") ou null se o Stripe
 * não estiver configurado ou não responder.
 */
export async function getOfferPriceLabel(
  priceId: string | undefined =
    process.env.STRIPE_PRICE_ID
) {
  if (!priceId) {
    return null;
  }

  try {
    const price =
      await retrieveStripePrice(priceId);

    if (price.unit_amount === null) {
      return null;
    }

    return formatMoney(
      price.unit_amount,
      price.currency
    );
  } catch (error) {
    if (
      !(error instanceof StripeConfigError)
    ) {
      console.error(
        "STRIPE_PRICE_ERROR",
        error instanceof Error
          ? error.message
          : error
      );
    }

    return null;
  }
}
