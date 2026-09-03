import type { Messages } from "@/lib/i18n/messages/fr";
import type { Locale } from "@/lib/i18n/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiduvia.ch";

/**
 * JSON-LD for the marketing page: an AccountingService describing the firm, and
 * a FAQPage built from the same FAQ the page renders, so the structured data
 * can never drift from the visible copy.
 *
 * Emitted with `type="application/ld+json"`, which the CSP in `src/proxy.ts`
 * permits — it is data, not an executable script, so the nonce does not apply.
 */
export function StructuredData({ locale, t }: { locale: Locale; t: Messages }) {
  const url = locale === "fr" ? `${SITE}/` : `${SITE}/${locale}`;

  const graph = [
    {
      "@type": "AccountingService",
      "@id": `${SITE}/#organization`,
      name: "Fiduvia",
      url,
      description: t.hero.p1,
      inLanguage: locale === "fr" ? "fr-CH" : "en",
      email: "contact@fiduvia.ch",
      telephone: "+41 21 000 00 00",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rue de Bourg 12",
        postalCode: "1003",
        addressLocality: "Lausanne",
        addressCountry: "CH",
      },
      areaServed: ["Vaud", "Valais", "Fribourg"].map((name) => ({
        "@type": "AdministrativeArea",
        name,
      })),
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "17:30",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: t.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // The payload is built from our own message bundle, not user input.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}
