import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasActiveAccess,
  isBillingEnabled,
} from "./access";
import { mapStripeSubscription } from "./map-subscription";
import { encodeStripeParams } from "./stripe";
import {
  computeStripeSignature,
  verifyStripeSignature,
} from "./stripe-signature";

const NOW = new Date("2026-10-15T12:00:00Z");

describe("hasActiveAccess", () => {
  it("libera assinatura ativa, em teste ou com pagamento pendente", () => {
    for (const status of ["active", "trialing", "past_due"]) {
      assert.equal(
        hasActiveAccess({ status, currentPeriodEnd: null }, NOW),
        true,
        status
      );
    }
  });

  it("mantém o acesso de cancelada até o fim do período pago", () => {
    assert.equal(
      hasActiveAccess(
        { status: "canceled", currentPeriodEnd: new Date("2026-10-20T00:00:00Z") },
        NOW
      ),
      true
    );

    assert.equal(
      hasActiveAccess(
        { status: "canceled", currentPeriodEnd: new Date("2026-10-10T00:00:00Z") },
        NOW
      ),
      false
    );

    assert.equal(
      hasActiveAccess({ status: "canceled", currentPeriodEnd: null }, NOW),
      false
    );
  });

  it("bloqueia sem assinatura ou com pagamento não concluído", () => {
    assert.equal(hasActiveAccess(null, NOW), false);

    for (const status of ["incomplete", "incomplete_expired", "unpaid", "paused"]) {
      assert.equal(
        hasActiveAccess(
          { status, currentPeriodEnd: new Date("2026-11-15T00:00:00Z") },
          NOW
        ),
        false,
        status
      );
    }
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
  const payload = JSON.stringify({ id: "evt_1", type: "customer.subscription.updated" });
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
      mode: "subscription",
      line_items: [{ price: "price_123", quantity: 1 }],
      metadata: { userId: "u 1" },
      ignored: undefined,
    });

    assert.equal(
      decodeURIComponent(encoded),
      "mode=subscription&line_items[0][price]=price_123&line_items[0][quantity]=1&metadata[userId]=u 1"
    );
  });
});

describe("mapStripeSubscription", () => {
  const base = {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    cancel_at_period_end: false,
    items: {
      data: [{ price: { id: "price_123" }, current_period_end: 1_762_000_000 }],
    },
  };

  it("lê o fim do período do item (API nova)", () => {
    const result = mapStripeSubscription(base);

    assert.equal(result.stripeCustomerId, "cus_123");
    assert.equal(result.stripeSubscriptionId, "sub_123");
    assert.equal(result.stripePriceId, "price_123");
    assert.equal(result.status, "active");
    assert.equal(result.currentPeriodEnd?.getTime(), 1_762_000_000_000);
    assert.equal(result.cancelAtPeriodEnd, false);
  });

  it("prefere o fim do período da assinatura (API antiga)", () => {
    const result = mapStripeSubscription({
      ...base,
      current_period_end: 1_761_000_000,
      cancel_at_period_end: true,
    });

    assert.equal(result.currentPeriodEnd?.getTime(), 1_761_000_000_000);
    assert.equal(result.cancelAtPeriodEnd, true);
  });
});
