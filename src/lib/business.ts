/**
 * The firm's factual details — one source of truth for the footer, the legal
 * pages, the contact screens and the SEO structured data, so a change of
 * address or the arrival of the IDE number is edited in exactly one place.
 *
 * These are facts, not translated copy: the address reads the same in French
 * and English. Locale-specific words around them (country name, labels) stay in
 * the message bundles.
 */
export const BUSINESS = {
  name: "Fiduvia",
  /** Sole proprietorship — «raison individuelle» under Swiss law. */
  legalForm: { fr: "Raison individuelle", en: "Sole proprietorship" },
  /** The natural person behind the raison individuelle. */
  owner: "Rathana Leas",

  email: "contact@fiduvia.ch",
  /**
   * No telephone number has been provided yet. Keep it null rather than showing
   * a placeholder — a fake number on a live site is worse than none, and the
   * contact form plus email cover enquiries.
   */
  phone: null as string | null,

  street: "Route de la Pontille 28",
  postalCode: "1618",
  city: "Châtel-St-Denis",
  canton: "Fribourg",
  countryCode: "CH",

  /** Châtel-St-Denis town centre, for the local-business map pin. */
  geo: { latitude: 46.5253, longitude: 6.9036 },

  /**
   * IDE/UID (Swiss business identifier) is not yet issued — the firm is being
   * registered. Null until it exists; the legal notice states this rather than
   * inventing one.
   */
  ide: null as string | null,

  /**
   * Not VAT-registered: turnover is under the CHF 100'000 threshold, so no VAT
   * is added and the published prices (CHF 80 / 120 / 250) are final.
   */
  vatRegistered: false,

  /** Where the app and its data physically live, named in the legal notice. */
  hosting: {
    name: "Infomaniak Network SA",
    address: "Rue Eugène-Marziano 25, 1227 Les Acacias, Genève, Suisse",
  },

  /** Cantons the marketing and structured data present as served. */
  areaServed: ["Fribourg", "Vaud", "Valais"],

  social: [
    "https://www.instagram.com/fiduvia.ch/",
    "https://www.facebook.com/profile.php?id=61592110525594",
  ],
} as const;

/** One-line postal address, e.g. "Route de la Pontille 28, 1618 Châtel-St-Denis". */
export function addressLine(): string {
  return `${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}`;
}
