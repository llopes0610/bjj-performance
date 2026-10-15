/*
 * Regra de acesso do BJJ Performance (só pago).
 *
 * Tem acesso quem tem assinatura ativa no Stripe. Enquanto o
 * Stripe tenta cobrar de novo (past_due), o acesso continua.
 * Uma assinatura cancelada mantém o acesso até o fim do
 * período já pago.
 */

export interface SubscriptionAccessInput {
  status: string;
  currentPeriodEnd: Date | null;
}

const ACTIVE_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export function hasActiveAccess(
  subscription:
    | SubscriptionAccessInput
    | null
    | undefined,
  now: Date = new Date()
): boolean {
  if (!subscription) {
    return false;
  }

  if (
    ACTIVE_STATUSES.has(
      subscription.status
    )
  ) {
    return true;
  }

  if (
    subscription.status ===
      "canceled" &&
    subscription.currentPeriodEnd
  ) {
    return (
      subscription.currentPeriodEnd.getTime() >
      now.getTime()
    );
  }

  return false;
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

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  unpaid: "Não paga",
  incomplete: "Aguardando pagamento",
  incomplete_expired: "Expirada",
  paused: "Pausada",
};

export function formatSubscriptionStatus(
  status: string
) {
  return (
    STATUS_LABELS[status] ?? status
  );
}
