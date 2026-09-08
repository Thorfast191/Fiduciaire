import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiduvia.ch";

/**
 * Canonical and hreflang for one public page.
 *
 * French is served prefix-free and English under `/en`, so the two URLs for a
 * page differ by more than a locale segment and cannot be derived generically.
 * `fr-CH` rather than plain `fr`: the content is Swiss — cantons, AVS numbers,
 * CHF — and a French reader in France is not the audience.
 */
export function localeAlternates(
  locale: Locale,
  /** Path without a locale prefix, e.g. "" or "/faq". */
  path: string,
): NonNullable<Metadata["alternates"]> {
  const fr = `${SITE}${path || "/"}`;
  const en = `${SITE}/en${path}`;

  return {
    canonical: locale === "fr" ? fr : en,
    languages: {
      "fr-CH": fr,
      en,
      "x-default": fr,
    },
  };
}

/** Open Graph and Twitter for one public page, sharing one card image. */
export function socialMeta(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const url = locale === "fr" ? `${SITE}${path || "/"}` : `${SITE}/en${path}`;

  return {
    openGraph: {
      type: "website",
      siteName: "Fiduvia",
      locale: locale === "fr" ? "fr_CH" : "en",
      url,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
