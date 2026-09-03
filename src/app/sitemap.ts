import type { MetadataRoute } from "next";
import { LOCALES, PUBLIC_PATHS } from "@/lib/i18n/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiduvia.ch";

/**
 * Only the public marketing pages belong here. `/portal` and `/admin` are
 * behind authentication and `robots.ts` disallows them, so listing them would
 * invite crawls that can only ever 302 to the login page.
 *
 * French is served prefix-free at "/", so it is listed as "/" rather than
 * "/fr", matching the canonical the page itself declares.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // "" is the home page; the rest are the public paths served alongside it.
  const paths = ["", ...PUBLIC_PATHS];

  return LOCALES.flatMap((locale) =>
    paths.map((path) => {
      const prefix = locale === "fr" ? "" : `/${locale}`;
      // The home page is "/", not a bare origin with no path.
      const suffix = `${prefix}${path}` || "/";

      return {
        url: `${SITE}${suffix}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: locale === "fr" && path === "" ? 1 : 0.6,
        alternates: {
          languages: {
            "fr-CH": `${SITE}${path || "/"}`,
            en: `${SITE}/en${path}`,
          },
        },
      };
    }),
  );
}
