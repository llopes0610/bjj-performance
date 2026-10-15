/*
 * Dados de exibição do plano. O valor cobrado de fato é o
 * do preço configurado no Stripe (STRIPE_PRICE_ID); mantenha
 * os dois iguais.
 */
export const MONTHLY_PLAN = {
  name: "BJJ Performance",
  priceLabel: "R$ 97,90",
  periodLabel: "por mês",

  features: [
    "Programa de preparação física individual para o seu Jiu-Jitsu",
    "Progressão semanal automática de cargas e volume",
    "Vídeos de execução de todos os exercícios",
    "Ajustes por restrições e dores",
    "Histórico, evolução, níveis e conquistas",
  ],
} as const;
