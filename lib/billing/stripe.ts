/*
 * Cliente mínimo da API REST do Stripe (sem SDK).
 *
 * Só usamos clientes, sessões de checkout, portal do
 * cliente e leitura de assinaturas. A chave secreta fica
 * somente no servidor (STRIPE_SECRET_KEY).
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

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;

  // Versões antigas da API trazem o fim do período
  // na assinatura; as novas, em cada item.
  current_period_end?: number | null;

  items: {
    data: {
      price: {
        id: string;
      };
      current_period_end?: number | null;
    }[];
  };

  metadata?: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  customer: string | null;
  subscription: string | null;
  client_reference_id: string | null;
  status: string | null;
}

/*
 * ========================================
 * OPERAÇÕES
 * ========================================
 */

export function createStripeCustomer({
  email,
  name,
  userId,
}: {
  email: string;
  name?: string | null;
  userId: string;
}) {
  return stripeRequest<{
    id: string;
  }>("POST", "/customers", {
    email,
    name: name ?? undefined,
    metadata: {
      userId,
    },
  });
}

export function createSubscriptionCheckout({
  customerId,
  userId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  userId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripeRequest<StripeCheckoutSession>(
    "POST",
    "/checkout/sessions",
    {
      mode: "subscription",
      customer: customerId,
      client_reference_id: userId,
      locale: "pt-BR",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      subscription_data: {
        metadata: {
          userId,
        },
      },

      success_url: successUrl,
      cancel_url: cancelUrl,
    }
  );
}

export function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return stripeRequest<{
    url: string;
  }>(
    "POST",
    "/billing_portal/sessions",
    {
      customer: customerId,
      return_url: returnUrl,
    }
  );
}

export function retrieveStripeSubscription(
  subscriptionId: string
) {
  return stripeRequest<StripeSubscription>(
    "GET",
    `/subscriptions/${encodeURIComponent(subscriptionId)}`
  );
}

export function retrieveCheckoutSession(
  sessionId: string
) {
  return stripeRequest<StripeCheckoutSession>(
    "GET",
    `/checkout/sessions/${encodeURIComponent(sessionId)}`
  );
}
