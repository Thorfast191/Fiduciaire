/**
 * What a document can be filed under.
 *
 * Deliberately a leaf module with no imports. It is read by `src/db/schema.ts`
 * for the column's enum and by `src/lib/documents.ts` for validation — having
 * the schema import the latter created a cycle (`schema -> documents ->
 * schema`) that type-checked fine and then failed at runtime with "Cannot
 * access before initialization" the moment anything loaded the schema first.
 *
 * The first six are the original fixed categories, kept because existing rows
 * and the non-declaration prestations still use them. The rest mirror
 * `DOCUMENT_CATALOGUE` in `src/lib/declaration.ts`: the questionnaire asks for
 * a specific piece per answer, and the transmission step matches an upload to
 * its requirement by this key.
 */
export const DOCUMENT_CATEGORIES = [
  "salaire",
  "releves_bancaires",
  "assurance",
  "pilier3",
  "justificatifs",
  "autre",
  "certSalaire",
  "compta",
  "tva",
  "renteAVS",
  "rente2p",
  "chomage",
  "pilier3a",
  "rachatLpp",
  "releveEpargne",
  "comptesTitres",
  "releveCompteImmeuble",
  "attestAssuranceVie",
  "pacteSuccessoral",
  "acteAchatVente",
  "bailLoyerImmeuble",
  "plansSurface",
  "bailLoyerLocataire",
  "primesMaladie",
  "fraisMedicaux",
  "fraisGarde",
  "pensionAlim",
  "jugementDivorce",
  "decisionTaxationOffice",
  "attestationDettes",
  "detteHypothecaire",
  "ficheTransmission",
  "copiePrecedente",
  "divers",
] as const;
