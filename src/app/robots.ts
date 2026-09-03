import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiduvia.ch";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated areas and the API have nothing crawlable and would only
      // ever redirect; /verify and /reset-password carry one-time tokens.
      disallow: ["/api/", "/portal", "/admin", "/verify", "/reset-password"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
