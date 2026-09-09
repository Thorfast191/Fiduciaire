/**
 * The declaration questionnaire: its answers, which supporting documents those
 * answers require, and what the whole thing costs.
 *
 * Ported from the client mockup — `computeDocs` (`Fiduvia.dc.html:5117`) and
 * `computePrice` (`:5157`). Both run on the server as well as the client, so
 * this module stays free of React and of `"use client"`.
 */

export const CANTONS = [
  "Vaud",
  "Valais",
  "Fribourg",
  "Genève",
  "Neuchâtel",
  "Berne",
  "Jura",
] as const;

/** The special situations offered before a declaration is started. */
export const SITUATIONS = [
  "standard",
  "arrivee",
  "taxation_office",
  "deces",
  "depart",
] as const;
export type Situation = (typeof SITUATIONS)[number];

export const MARITAL = [
  "celibataire",
  "marie",
  "partenariat",
  "divorce",
  "veuf",
] as const;
export type Marital = (typeof MARITAL)[number];

export const INCOME_KINDS = [
  "salarie",
  "etudiant",
  "independant",
  "rentier",
  "chomage",
] as const;
export type IncomeKind = (typeof INCOME_KINDS)[number];

export const WEALTH_KINDS = [
  "epargne",
  "titres",
  "crypto",
  "assuranceVie",
  "immeuble",
] as const;
export type WealthKind = (typeof WEALTH_KINDS)[number];

export interface Child {
  firstName: string;
  lastName: string;
  birthDate: string;
  avs: string;
  situation: string;
  /** Whether the child receives maintenance contributions. */
  contributions: "oui" | "non" | "";
}

export interface Property {
  street: string;
  postcode: string;
  country: string;
  share: string;
  acquisition: "achat" | "heritage" | "donation" | "";
  alienation: "vente" | "donation" | "";
  rented: "oui" | "non" | "";
  hasDebt: "oui" | "non" | "";
}

export interface Answers {
  situation: Situation;
  canton: string;
  departureDate: string;
  arrivalDate: string;
  express: boolean;
  etatCivil: Marital | "";
  children: Child[];
  revenus: Partial<Record<IncomeKind, boolean>>;
  fortuneTypes: Partial<Record<WealthKind, boolean>>;
  dettes: "oui" | "non" | "";
  heritageEnCours: "oui" | "non" | "";
  proprietaireImmeuble: "oui" | "non" | "";
  immeubles: Property[];
  loyersPayes: "oui" | "non" | "";
  taxationOffice: "oui" | "non" | "";
  pilier3: boolean;
  rachat2: boolean;
  assistance: Partial<Record<AssistanceKey, boolean>>;
  /** Free-text remark per questionnaire page. */
  comments: Record<string, string>;
}

export function emptyAnswers(): Answers {
  return {
    situation: "standard",
    canton: "Vaud",
    departureDate: "",
    arrivalDate: "",
    express: false,
    etatCivil: "",
    children: [],
    revenus: {},
    fortuneTypes: {},
    dettes: "",
    heritageEnCours: "",
    proprietaireImmeuble: "",
    immeubles: [],
    loyersPayes: "",
    taxationOffice: "",
    pilier3: false,
    rachat2: false,
    assistance: {},
    comments: {},
  };
}

/** Tolerates a partial or legacy row without throwing on a missing field. */
export function normaliseAnswers(raw: unknown): Answers {
  const base = emptyAnswers();
  if (!raw || typeof raw !== "object") return base;
  return { ...base, ...(raw as Partial<Answers>) };
}

// ---------------------------------------------------------------- documents

export const DOCUMENT_CATALOGUE: Record<
  string,
  { title: string; hint: string }
> = {
  certSalaire: { title: "Certificat de salaire", hint: "Pour chaque emploi de l'année" },
  compta: { title: "Comptabilité de l'activité", hint: "Bilan et compte de résultat" },
  tva: { title: "Décomptes TVA", hint: "Si vous êtes assujetti à la TVA" },
  renteAVS: { title: "Rentes AVS / AI", hint: "Décompte annuel de rente" },
  rente2p: { title: "Rentes 2e pilier", hint: "Décompte de rente LPP" },
  chomage: { title: "Décompte de chômage", hint: "Caisse de chômage" },
  pilier3a: { title: "Justificatif de la cotisation 3e pilier A", hint: "Versement de l'année" },
  rachatLpp: { title: "Rachat 2e pilier", hint: "Rachat d'assurance / LPP" },
  releveEpargne: { title: "Relevés compte(s) épargne", hint: "État de votre fortune épargne au 31.12" },
  comptesTitres: { title: "Comptes et titres bancaires", hint: "État de votre fortune investie/en bourse au 31.12" },
  releveCompteImmeuble: { title: "Relevé(s) compte(s) immeuble", hint: "État du compte lié à l'immeuble au 31.12" },
  attestAssuranceVie: { title: "Attestation d'assurance-vie", hint: "Valeur de rachat au 31.12" },
  pacteSuccessoral: { title: "Pacte successoral", hint: "Ou justificatif d'héritage" },
  acteAchatVente: { title: "Acte d'achat / vente", hint: "Acte notarié" },
  bailLoyerImmeuble: { title: "Bail(baux) à loyer", hint: "Loyers perçus" },
  plansSurface: { title: "Plans avec surface", hint: "Pour la valeur locative" },
  bailLoyerLocataire: { title: "Bail à loyer", hint: "En tant que locataire" },
  primesMaladie: { title: "Primes d'assurance-maladie", hint: "Décompte annuel LAMal" },
  fraisMedicaux: { title: "Frais médicaux", hint: "Factures et justificatifs" },
  fraisGarde: { title: "Frais de garde", hint: "Crèche, parascolaire, maman de jour" },
  pensionAlim: { title: "Pension alimentaire versée / perçue", hint: "Justificatifs des montants" },
  jugementDivorce: { title: "Jugement de divorce", hint: "Convention et jugement" },
  decisionTaxationOffice: { title: "Décision de taxation d'office", hint: "Copie de la décision reçue de l'office d'impôt" },
  attestationDettes: { title: "Attestation de dettes", hint: "Relevés de prêts, crédits ou dettes au 31.12" },
  detteHypothecaire: { title: "Dette hypothécaire", hint: "Attestation de la dette hypothécaire au 31.12" },
  ficheTransmission: { title: "Fiche de transmission de la déclaration d'impôts", hint: "Transmise par votre canton, avec code de contrôle" },
  copiePrecedente: { title: "Copie de la déclaration d'impôts de l'année précédente", hint: "" },
  divers: { title: "Divers documents", hint: "Frais de perfectionnement, dons, etc." },};

export type DocumentKey = keyof typeof DOCUMENT_CATALOGUE;

/**
 * Which supporting documents the answers call for.
 *
 * Order matters: it is the order the client sees them in, and the mockup puts
 * the two universally-required pieces first and "divers" last.
 */
export function requiredDocuments(a: Answers): string[] {
  const d: string[] = ["ficheTransmission", "copiePrecedente"];

  const r = a.revenus ?? {};
  if (r.salarie) d.push("certSalaire");
  if (r.rentier) d.push("renteAVS", "rente2p");
  if (r.chomage) d.push("chomage");
  if (r.independant) d.push("compta", "tva");

  const ft = a.fortuneTypes ?? {};
  if (ft.titres) d.push("comptesTitres");
  if (ft.epargne) d.push("releveEpargne");
  if (ft.assuranceVie) d.push("attestAssuranceVie");
  if (ft.immeuble) d.push("releveCompteImmeuble");

  if (a.dettes === "oui") d.push("attestationDettes");
  if (a.heritageEnCours === "oui") d.push("pacteSuccessoral");

  if (a.proprietaireImmeuble === "oui") {
    const ims = a.immeubles ?? [];
    if (ims.some((im) => im.acquisition === "achat" || im.alienation === "vente"))
      d.push("acteAchatVente");
    if (
      ims.some(
        (im) =>
          im.acquisition === "heritage" ||
          im.acquisition === "donation" ||
          im.alienation === "donation",
      )
    )
      d.push("pacteSuccessoral");
    if (ims.some((im) => im.rented === "oui")) d.push("bailLoyerImmeuble");
    if (ims.some((im) => im.rented === "non")) d.push("plansSurface");
    if (ims.some((im) => im.hasDebt === "oui")) d.push("detteHypothecaire");
  }

  if (a.loyersPayes === "oui") d.push("bailLoyerLocataire");
  if (a.taxationOffice === "oui") d.push("decisionTaxationOffice");
  if (a.pilier3) d.push("pilier3a");
  if (a.rachat2) d.push("rachatLpp");

  d.push("primesMaladie", "fraisMedicaux");

  if ((a.children ?? []).length > 0) d.push("fraisGarde");
  if ((a.children ?? []).some((c) => c.contributions === "oui"))
    d.push("pensionAlim");
  if (a.etatCivil === "divorce") d.push("jugementDivorce");

  d.push("divers");

  return Array.from(new Set(d));
}

// ------------------------------------------------------------------ pricing

export const ASSISTANCE_OPTIONS = [
  { key: "delai", price: 10 },
  { key: "suivi", price: 25 },
  { key: "analyse", price: 25 },
  { key: "reclamation", price: 50 },
  { key: "ensemble", price: 75 },
] as const;

export type AssistanceKey = (typeof ASSISTANCE_OPTIONS)[number]["key"];

export const ASSISTANCE_BUNDLE_PRICE = 75;

/**
 * Individually-chosen options, collapsed to the bundle once they reach its
 * price — nobody should pay more for the parts than for the whole.
 */
export function assistanceTotal(
  selection: Partial<Record<AssistanceKey, boolean>>,
): number {
  if (selection.ensemble) return ASSISTANCE_BUNDLE_PRICE;
  const sum = ASSISTANCE_OPTIONS.filter(
    (o) => o.key !== "ensemble" && selection[o.key],
  ).reduce((total, o) => total + o.price, 0);
  return Math.min(sum, ASSISTANCE_BUNDLE_PRICE);
}

export interface PriceLine {
  /** i18n key under `t.declaration.price`, plus an optional multiplier. */
  key: string;
  count?: number;
  amount: number;
}

export const TAXATION_OFFICE_PRICE = 75;
export const EXPRESS_PRICE = 50;

export function computePrice(a: Answers): {
  lines: PriceLine[];
  total: number;
} {
  const lines: PriceLine[] = [];

  const married = a.etatCivil === "marie" || a.etatCivil === "partenariat";
  const independent = !!a.revenus?.independant;
  const student = !!a.revenus?.etudiant;

  // Base tariff, one tier only. Self-employed is the most involved (250); a
  // student/apprentice the simplest (25); otherwise it is the couple/single
  // rate. Self-employment wins over the student rate if somehow both are set.
  if (independent) {
    lines.push({ key: "independant", amount: 250 });
  } else if (student) {
    lines.push({ key: "etudiant", amount: 25 });
  } else {
    lines.push({
      key: married ? "couple" : "base",
      amount: married ? 120 : 80,
    });
  }

  if (a.proprietaireImmeuble === "oui") {
    const count = Math.max(1, (a.immeubles ?? []).length);
    lines.push({ key: "owner", count, amount: 75 * count });
  }

  const ft = a.fortuneTypes ?? {};
  if (ft.titres || ft.crypto) lines.push({ key: "titres", amount: 30 });
  if (a.heritageEnCours === "oui") lines.push({ key: "heritage", amount: 25 });
  if (a.express) lines.push({ key: "express", amount: EXPRESS_PRICE });

  const assistance = assistanceTotal(a.assistance ?? {});
  if (assistance > 0) lines.push({ key: "assistance", amount: assistance });

  if (a.taxationOffice === "oui")
    lines.push({ key: "taxationOffice", amount: TAXATION_OFFICE_PRICE });

  return {
    lines,
    total: lines.reduce((sum, l) => sum + l.amount, 0),
  };
}

// ---------------------------------------------------------------- the steps

export const STEPS = [
  "accueil",
  "famille",
  "revenus",
  "fortune",
  "immeubles",
  "deductions",
  "transmission",
] as const;

export type Step = (typeof STEPS)[number];

// ------------------------------------------------------------- admin summary

export interface SummaryRow {
  /** i18n key under `t.declaration.summary`. */
  key: string;
  value: string;
}

export interface SummarySection {
  /** One of `STEPS`, so the admin sees the same grouping the client filled in. */
  step: Step;
  rows: SummaryRow[];
  /** The client's free-text remark for that page, if they left one. */
  remark?: string;
}

/**
 * The answers, flattened for reading rather than editing.
 *
 * Values are already-resolved strings so the caller does no lookups: an
 * administrator reading a submitted declaration wants the same words the
 * client saw, not enum keys. `labels` supplies those words for the closed
 * vocabularies — it is the caller's `t.declaration` subtree.
 */
export function summariseAnswers(
  a: Answers,
  labels: {
    yes: string;
    no: string;
    none: string;
    situations: Record<string, string>;
    marital: Record<string, string>;
    income: Record<string, string>;
    wealth: Record<string, string>;
  },
): SummarySection[] {
  const bool = (v: string) => (v === "oui" ? labels.yes : v === "non" ? labels.no : labels.none);
  const list = (
    map: Partial<Record<string, boolean>>,
    dict: Record<string, string>,
  ) => {
    const on = Object.keys(map).filter((k) => map[k]);
    return on.length ? on.map((k) => dict[k] ?? k).join(", ") : labels.none;
  };

  const remark = (i: number) => a.comments?.[`p${i}`] || undefined;

  return [
    {
      step: "accueil",
      remark: remark(0),
      rows: [
        { key: "situation", value: labels.situations[a.situation] ?? a.situation },
        { key: "canton", value: a.canton || labels.none },
        ...(a.situation === "depart"
          ? [{ key: "departureDate", value: a.departureDate || labels.none }]
          : []),
        ...(a.situation === "arrivee"
          ? [{ key: "arrivalDate", value: a.arrivalDate || labels.none }]
          : []),
        { key: "express", value: a.express ? labels.yes : labels.no },
        { key: "taxationOffice", value: bool(a.taxationOffice) },
      ],
    },
    {
      step: "famille",
      remark: remark(1),
      rows: [
        {
          key: "etatCivil",
          value: a.etatCivil ? (labels.marital[a.etatCivil] ?? a.etatCivil) : labels.none,
        },
        { key: "children", value: String((a.children ?? []).length) },
        ...(a.children ?? []).map((c, i) => ({
          key: "child",
          value:
            `${i + 1}. ${[c.firstName, c.lastName].filter(Boolean).join(" ") || labels.none}` +
            (c.birthDate ? ` · ${c.birthDate}` : "") +
            (c.avs ? ` · ${c.avs}` : ""),
        })),
      ],
    },
    {
      step: "revenus",
      remark: remark(2),
      rows: [{ key: "revenus", value: list(a.revenus ?? {}, labels.income) }],
    },
    {
      step: "fortune",
      remark: remark(3),
      rows: [
        { key: "fortuneTypes", value: list(a.fortuneTypes ?? {}, labels.wealth) },
        { key: "dettes", value: bool(a.dettes) },
        { key: "heritage", value: bool(a.heritageEnCours) },
      ],
    },
    {
      step: "immeubles",
      remark: remark(4),
      rows: [
        { key: "proprietaire", value: bool(a.proprietaireImmeuble) },
        ...(a.immeubles ?? []).map((p, i) => ({
          key: "property",
          value:
            `${i + 1}. ${[p.street, p.postcode, p.country].filter(Boolean).join(", ") || labels.none}` +
            (p.share ? ` · ${p.share}%` : ""),
        })),
        { key: "loyersPayes", value: bool(a.loyersPayes) },
      ],
    },
    {
      step: "deductions",
      remark: remark(5),
      rows: [
        { key: "pilier3", value: a.pilier3 ? labels.yes : labels.no },
        { key: "rachat2", value: a.rachat2 ? labels.yes : labels.no },
      ],
    },
  ];
}
