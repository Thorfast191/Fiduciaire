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
export function StructuredData({
  locale,
  t,
  /** When set, the FAQPage lists these instead of the home page's first four. */
  faqItems,
  /** Canonical URL of the page carrying this markup. */
  pageUrl,
}: {
  locale: Locale;
  t: Messages;
  faqItems?: { q: string; a: string }[];
  pageUrl?: string;
}) {
  const url = pageUrl ?? (locale === "fr" ? `${SITE}/` : `${SITE}/${locale}`);

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
      // Google shows a price range on the local panel and uses it to match
      // "cheap"/"affordable" style queries; ours comes from the public tariff.
      priceRange: "CHF 80–250",
      currenciesAccepted: "CHF",
      paymentAccepted: "Bank transfer, TWINT, credit card",
      // Lausanne city centre. Coordinates are what tie the listing to a place
      // for "fiduciaire près de moi" searches, which is most of the local intent.
      geo: {
        "@type": "GeoCoordinates",
        latitude: 46.5197,
        longitude: 6.6323,
      },
      // The profiles linked in the site footer, so the entity resolves to the
      // same business across them.
      sameAs: [
        "https://www.instagram.com/fiduvia.ch/",
        "https://www.facebook.com/profile.php?id=61592110525594",
      ],
      knowsLanguage: ["fr-CH", "en"],
      // The prestations the site sells, named the way a searcher would.
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: t.services.title,
        itemListElement: (
          [
            "declaration",
            "capital",
            "departure",
            "deces",
            "simulation",
            "acompte",
          ] as const
        ).map((key) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: t.services.types[key].name,
            description: t.services.types[key].desc,
            serviceType: t.services.types[key].name,
            areaServed: "CH",
          },
        })),
      },
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
      mainEntity: (faqItems ?? t.faq.items.slice(0, 4)).map((item) => ({
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
