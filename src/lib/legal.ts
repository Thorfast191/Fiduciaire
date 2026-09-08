import legalFr from "@/content/legal.fr.json";

/**
 * The firm's legal documents, ported verbatim from the client's own drafts in
 * the fiduvia.ch mockup (`Fiduvia.dc.html`): the cookie policy, the legal
 * notice, the privacy policy and the CGVU. Kept as data — one structured JSON
 * per language — so the ~15'000 words of legal text stay out of the JSX and a
 * revision is a content edit, not a code change.
 *
 * French is the authoritative version (the text is drafted under Swiss law, in
 * French); the English routes render the same French text under a short notice,
 * which is the usual practice for a Swiss SME and avoids an unreviewed machine
 * translation of binding legal terms.
 */
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "card"; lines: string[] };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  /** «Dernière mise à jour», as authored in the source. */
  updated: string;
  intro: LegalBlock[];
  sections: LegalSection[];
}

export type LegalDocKey = "cookies" | "mentions" | "privacy" | "cgvu";

const DOCS = legalFr as Record<LegalDocKey, LegalDocument>;

export function getLegalDoc(key: LegalDocKey): LegalDocument {
  return DOCS[key];
}

/** Route slug ↔ document, so a page and the footer name the same URL. */
export const LEGAL_ROUTES: Record<
  LegalDocKey,
  { slug: string; footerKey: "privacy" | "legal" | "terms" | "cookies" }
> = {
  privacy: { slug: "confidentialite", footerKey: "privacy" },
  mentions: { slug: "mentions-legales", footerKey: "legal" },
  cgvu: { slug: "cgvu", footerKey: "terms" },
  cookies: { slug: "cookies", footerKey: "cookies" },
};
