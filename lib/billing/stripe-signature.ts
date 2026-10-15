import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

/*
 * Verificação do cabeçalho Stripe-Signature, no mesmo
 * formato da biblioteca oficial:
 *
 *   Stripe-Signature: t=<timestamp>,v1=<hmac>[,v1=...]
 *
 * O HMAC-SHA256 é calculado sobre "<timestamp>.<corpo>" com
 * o segredo do endpoint (whsec_...). Eventos com timestamp
 * fora da tolerância são recusados para evitar replay.
 */

const DEFAULT_TOLERANCE_SECONDS = 300;

export function computeStripeSignature(
  payload: string,
  timestamp: number,
  secret: string
) {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");
}

function safeEqualHex(
  a: string,
  b: string
) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");

  return (
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}

export function verifyStripeSignature({
  payload,
  header,
  secret,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  payload: string;
  header: string | null | undefined;
  secret: string;
  toleranceSeconds?: number;
  nowSeconds?: number;
}): boolean {
  if (!header || !secret) {
    return false;
  }

  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of header.split(",")) {
    const separator = part.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = part
      .slice(0, separator)
      .trim();

    const value = part
      .slice(separator + 1)
      .trim();

    if (key === "t") {
      timestamp = /^\d+$/.test(value)
        ? Number(value)
        : null;
    }

    if (key === "v1" && value) {
      signatures.push(value);
    }
  }

  if (
    timestamp === null ||
    signatures.length === 0
  ) {
    return false;
  }

  if (
    Math.abs(nowSeconds - timestamp) >
    toleranceSeconds
  ) {
    return false;
  }

  const expected =
    computeStripeSignature(
      payload,
      timestamp,
      secret
    );

  return signatures.some((signature) =>
    safeEqualHex(signature, expected)
  );
}
