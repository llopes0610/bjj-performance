/*
 * Regra de acesso do BJJ Performance.
 *
 * Pagamento único: quem tem uma compra com status "paid"
 * tem acesso permanente ao produto. Não há assinatura,
 * renovação nem cancelamento.
 */

export const PAID_PURCHASE_STATUS =
  "paid";

export interface PurchaseAccessInput {
  status: string;
}

export function hasPaidAccess(
  purchases:
    | readonly PurchaseAccessInput[]
    | null
    | undefined
): boolean {
  return (purchases ?? []).some(
    (purchase) =>
      purchase.status ===
      PAID_PURCHASE_STATUS
  );
}

/*
 * A cobrança só é exigida com BILLING_ENABLED="true".
 * Sem isso (ambiente de desenvolvimento sem chaves do
 * Stripe), todos os usuários têm acesso.
 */
export function isBillingEnabled(
  env: Record<string, string | undefined> = process.env
) {
  return env.BILLING_ENABLED === "true";
}
