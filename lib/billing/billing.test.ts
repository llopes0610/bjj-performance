import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasPaidAccess,
  isBillingEnabled,
} from "./access";
import { evaluateCheckoutSession } from "./checkout-validation";
import { formatMoney } from "./plan";
import type { StripeCheckoutSession } from "./stripe";
import { encodeStripeParams } from "./stripe";
import {
  computeStripeSignature,
  verifyStripeSignature,
} from "./stripe-signature";

describe("hasPaidAccess", () => {
  it("libera com pelo menos uma compra paga", () => {
    assert.equal(hasPaidAccess([{ status: "paid" }]), true);
    assert.equal(hasPaidAccess([{ status: "refunded" }, { status: "paid" }]), true);
  });

  it("bloqueia sem compra ou sem compra paga", () => {
    assert.equal(hasPaidAccess(null), false);
    assert.equal(hasPaidAccess([]), false);
    assert.equal(hasPaidAccess([{ status: "refunded" }]), false);
  });
});

describe("isBillingEnabled", () => {
  it("só liga a cobrança com BILLING_ENABLED=true", () => {
    assert.equal(isBillingEnabled({ BILLING_ENABLED: "true" }), true);
    assert.equal(isBillingEnabled({ BILLING_ENABLED: "1" }), false);
    assert.equal(isBillingEnabled({}), false);
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });
  const timestamp = 1_760_000_000;
  const signature = computeStripeSignature(payload, timestamp, secret);

  it("aceita assinatura válida dentro da tolerância", () => {
    assert.equal(
      verifyStripeSignature({
        payload,
        header: `t=${timestamp},v1=${signature}`,
        secret,
        nowSeconds: timestamp + 10,
      }),
      true
    );
  });

  it("aceita quando uma das várias assinaturas v1 confere", () => {
    assert.equal(
      verifyStripeSignature({
        payload,
        header: `t=${timestamp},v1=deadbeef,v1=${signature},v0=ignorado`,
        secret,
        nowSeconds: timestamp,
      }),
      true
    );
  });

  it("recusa corpo alterado, segredo errado, replay e cabeçalho inválido", () => {
    const base = { secret, nowSeconds: timestamp };

    assert.equal(
      verifyStripeSignature({
        ...base,
        payload: payload.replace("evt_1", "evt_2"),
        header: `t=${timestamp},v1=${signature}`,
      }),
      false
    );

    assert.equal(
      verifyStripeSignature({
        ...base,
        payload,
        secret: "whsec_outro",
        header: `t=${timestamp},v1=${signature}`,
      }),
      false
    );

    assert.equal(
      verifyStripeSignature({
        ...base,
        payload,
        header: `t=${timestamp},v1=${signature}`,
        nowSeconds: timestamp + 301,
      }),
      false
    );

    for (const header of [null, "", "v1=abc", `t=abc,v1=${signature}`, `t=${timestamp}`]) {
      assert.equal(
        verifyStripeSignature({ ...base, payload, header }),
        false,
        String(header)
      );
    }
  });
});

describe("encodeStripeParams", () => {
  it("codifica objetos e listas aninhados como o Stripe espera", () => {
    const encoded = encodeStripeParams({
      mode: "payment",
      line_items: [{ price: "price_123", quantity: 1 }],
      metadata: { userId: "u 1" },
      ignored: undefined,
    });

    assert.equal(
      decodeURIComponent(encoded),
      "mode=payment&line_items[0][price]=price_123&line_items[0][quantity]=1&metadata[userId]=u 1"
    );
  });
});

describe("evaluateCheckoutSession", () => {
  const PRICE = "price_unico";

  const paid: StripeCheckoutSession = {
    id: "cs_test_123",
    url: null,
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    client_reference_id: "user_1",
    metadata: { userId: "user_1" },
    customer: null,
    payment_intent: "pi_123",
    amount_total: 9790,
    currency: "brl",
    line_items: {
      data: [{ quantity: 1, price: { id: PRICE } }],
    },
  };

  it("aceita sessão paga, de pagamento único e com o preço esperado", () => {
    assert.deepEqual(evaluateCheckoutSession(paid, PRICE), {
      kind: "paid",
      purchase: {
        userId: "user_1",
        stripeCheckoutSessionId: "cs_test_123",
        stripePaymentIntentId: "pi_123",
        stripeCustomerId: null,
        stripePriceId: PRICE,
        amountTotal: 9790,
        currency: "brl",
      },
    });
  });

  it("lê o payment_intent expandido", () => {
    const result = evaluateCheckoutSession(
      { ...paid, payment_intent: { id: "pi_456" } },
      PRICE
    );

    assert.equal(result.kind === "paid" && result.purchase.stripePaymentIntentId, "pi_456");
  });

  it("aguarda pagamento assíncrono não confirmado", () => {
    assert.deepEqual(
      evaluateCheckoutSession({ ...paid, payment_status: "unpaid" }, PRICE),
      { kind: "pending" }
    );
  });

  it("recusa assinatura, outro preço, usuário ausente ou divergente", () => {
    const cases: StripeCheckoutSession[] = [
      { ...paid, mode: "subscription" },
      { ...paid, line_items: { data: [{ quantity: 1, price: { id: "price_outro" } }] } },
      { ...paid, line_items: undefined },
      { ...paid, client_reference_id: null },
      { ...paid, metadata: { userId: "user_2" } },
      { ...paid, payment_status: "no_payment_required" },
      { ...paid, amount_total: null },
    ];

    for (const session of cases) {
      assert.equal(evaluateCheckoutSession(session, PRICE).kind, "rejected");
    }
  });
});

describe("formatMoney", () => {
  it("formata centavos em reais", () => {
    assert.equal(formatMoney(9790, "brl").replace(/\s/g, " "), "R$ 97,90");
  });
});
