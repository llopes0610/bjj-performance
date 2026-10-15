/*
 * URL pública do app, usada nos retornos do Stripe.
 * Em produção defina APP_URL (ex.: https://app.exemplo.com);
 * sem ela, usa a origem da requisição.
 */
export function getAppUrl(
  request: Request
) {
  const configured =
    process.env.APP_URL?.replace(
      /\/+$/,
      ""
    );

  return (
    configured ||
    new URL(request.url).origin
  );
}
