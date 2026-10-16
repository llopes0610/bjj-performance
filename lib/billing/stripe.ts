/*
 * Cliente mínimo da API REST do Stripe (sem SDK).
 *
 * Só usamos o Checkout de pagamento único e a leitura de
 * sessões e preços. A chave secreta fica somente no
 * servidor (STRIPE_SECRET_KEY) e nunca vai para logs.
 */

const STRIPE_API_URL =
  "https://api.stripe.com/v1";

type StripeParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | StripeParams
  | StripeParamValue[];

export interface StripeParams {
  [key: string]: StripeParamValue;
}

export class StripeConfigError extends Error {}

export class StripeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

/*
 * Codifica parâmetros aninhados no formato que o Stripe
 * espera: line_items[0][price]=price_123
 */
export function encodeStripeParams(
  params: StripeParams
): string {
  const pairs: string[] = [];

  function add(
    key: string,
    value: StripeParamValue
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        add(`${key}[${index}]`, item)
      );
      return;
    }

    if (typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(value)) {
        add(`${key}[${childKey}]`, childValue);
      }
      return;
    }

    pairs.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    );
  }

  for (const [key, value] of Object.entries(params)) {
    add(key, value);
  }

  return pairs.join("&");
}

export function getStripeConfig() {
  const secretKey =
    process.env.STRIPE_SECRET_KEY;

  const priceId =
    process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    throw new StripeConfigError(
      "STRIPE_SECRET_KEY e STRIPE_PRICE_ID precisam estar definidos."
    );
  }

  return {
    secretKey,
    priceId,
  };
}

async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  params: StripeParams = {}
): Promise<T> {
  const { secretKey } =
    getStripeConfig();

  const body =
    encodeStripeParams(params);

  const url =
    method === "GET" && body
      ? `${STRIPE_API_URL}${path}?${body}`
      : `${STRIPE_API_URL}${path}`;

  const response = await fetch(url, {
    method,

    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type":
        "application/x-www-form-urlencoded",
    },

    body:
      method === "POST"
        ? body
        : undefined,

    cache: "no-store",
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new StripeApiError(
      data?.error?.message ??
        `Stripe respondeu ${response.status}.`,
      response.status,
      data?.error?.code
    );
  }

  return data as T;
}

/*
 * ========================================
 * TIPOS (apenas os campos usados)
 * ========================================
 */

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  mode: string;
  status: string | null;
  payment_status: string;

  client_reference_id: string | null;
  metadata: Record<string, string> | null;

  customer: string | null;
  payment_intent:
    | string
    | {
        id: string;
      }
    | null;

  amount_total: number | null;
  currency: string | null;

  line_items?: {
    data: {
      quantity: number | null;
      price: {
        id: string;
      } | null;
    }[];
  };
}

export interface StripePrice {
  id: string;
  unit_amount: number | null;
  currency: string;
  type: string;
  active: boolean;
}

/*
 * ========================================
 * OPERAÇÕES
 * ========================================
 */

/*
 * Checkout de pagamento único. O usuário vem da sessão
 * autenticada no servidor e vai em client_reference_id e
 * nos metadados, para o webhook saber quem comprou.
 */
export function createPaymentCheckout({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripeRequest<StripeCheckoutSession>(
    "POST",
    "/checkout/sessions",
    {
      mode: "payment",
      client_reference_id: userId,
      customer_email: email,
      locale: "pt-BR",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata: {
        userId,
      },

      payment_intent_data: {
        metadata: {
          userId,
        },
      },

      success_url: successUrl,
      cancel_url: cancelUrl,
    }
  );
}

/*
 * Lê a sessão no Stripe com os itens, para conferir o
 * preço pago (o corpo do webhook não traz line_items).
 */
export function retrieveCheckoutSession(
  sessionId: string
) {
  return stripeRequest<StripeCheckoutSession>(
    "GET",
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      expand: ["line_items"],
    }
  );
}

export function retrieveStripePrice(
  priceId: string
) {
  return stripeRequest<StripePrice>(
    "GET",
    `/prices/${encodeURIComponent(priceId)}`
  );
}
