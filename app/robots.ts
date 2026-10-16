import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/register"],
      disallow: [
        "/api/",
        "/dashboard",
        "/workout",
        "/history",
        "/progress",
        "/profile",
        "/onboarding",
        "/plans",
        "/billing",
      ],
    },

    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
