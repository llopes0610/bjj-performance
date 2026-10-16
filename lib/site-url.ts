/*
 * URL pública do site (APP_URL), usada em metadados,
 * robots e sitemap. Sem APP_URL (desenvolvimento),
 * usa localhost.
 */
export function getSiteUrl() {
  return (
    process.env.APP_URL?.replace(
      /\/+$/,
      ""
    ) || "http://localhost:3000"
  );
}
