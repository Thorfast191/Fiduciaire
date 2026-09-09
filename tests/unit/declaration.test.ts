import { describe, it, expect } from "vitest";
import {
  emptyAnswers,
  normaliseAnswers,
  requiredDocuments,
  computePrice,
  assistanceTotal,
  DOCUMENT_CATALOGUE,
  type Answers,
} from "../../src/lib/declaration";

function answers(patch: Partial<Answers>): Answers {
  return { ...emptyAnswers(), ...patch };
}

describe("requiredDocuments", () => {
  it("always asks for the transmission slip and last year's return", () => {
    expect(requiredDocuments(emptyAnswers()).slice(0, 2)).toEqual([
      "ficheTransmission",
      "copiePrecedente",
    ]);
  });

  it("asks for a salary certificate only from an employee", () => {
    expect(requiredDocuments(answers({ revenus: { salarie: true } }))).toContain(
      "certSalaire",
    );
    expect(requiredDocuments(emptyAnswers())).not.toContain("certSalaire");
  });

  it("asks the self-employed for accounts and VAT statements", () => {
    const docs = requiredDocuments(answers({ revenus: { independant: true } }));
    expect(docs).toContain("compta");
    expect(docs).toContain("tva");
  });

  it("asks a pensioner for both pension statements", () => {
    const docs = requiredDocuments(answers({ revenus: { rentier: true } }));
    expect(docs).toEqual(expect.arrayContaining(["renteAVS", "rente2p"]));
  });

  it("derives property documents from each property's own answers", () => {
    const docs = requiredDocuments(
      answers({
        proprietaireImmeuble: "oui",
        immeubles: [
          {
            street: "",
            postcode: "",
            country: "",
            share: "",
            acquisition: "achat",
            alienation: "",
            rented: "oui",
            hasDebt: "oui",
          },
        ],
      }),
    );

    expect(docs).toEqual(
      expect.arrayContaining([
        "acteAchatVente",
        "bailLoyerImmeuble",
        "detteHypothecaire",
      ]),
    );
    // Rented out, so the surface plans for owner-occupied are not asked for.
    expect(docs).not.toContain("plansSurface");
  });

  it("asks for a divorce judgment only when divorced", () => {
    expect(requiredDocuments(answers({ etatCivil: "divorce" }))).toContain(
      "jugementDivorce",
    );
    expect(requiredDocuments(answers({ etatCivil: "marie" }))).not.toContain(
      "jugementDivorce",
    );
  });

  it("asks for maintenance proof only when a child receives contributions", () => {
    const child = {
      firstName: "",
      lastName: "",
      birthDate: "",
      avs: "",
      situation: "",
      contributions: "oui" as const,
    };
    expect(requiredDocuments(answers({ children: [child] }))).toContain(
      "pensionAlim",
    );
    expect(
      requiredDocuments(
        answers({ children: [{ ...child, contributions: "non" }] }),
      ),
    ).not.toContain("pensionAlim");
  });

  it("never repeats a document, however many rules ask for it", () => {
    const docs = requiredDocuments(
      answers({
        heritageEnCours: "oui",
        proprietaireImmeuble: "oui",
        immeubles: [
          {
            street: "",
            postcode: "",
            country: "",
            share: "",
            acquisition: "heritage",
            alienation: "",
            rented: "",
            hasDebt: "",
          },
        ],
      }),
    );
    // Both the inheritance answer and the property's origin ask for it.
    expect(docs.filter((d) => d === "pacteSuccessoral")).toHaveLength(1);
    expect(new Set(docs).size).toBe(docs.length);
  });

  it("only ever names documents the catalogue can describe", () => {
    const docs = requiredDocuments(
      answers({
        revenus: { salarie: true, independant: true, rentier: true, chomage: true },
        fortuneTypes: {
          epargne: true,
          titres: true,
          assuranceVie: true,
          immeuble: true,
        },
        dettes: "oui",
        heritageEnCours: "oui",
        loyersPayes: "oui",
        taxationOffice: "oui",
        pilier3: true,
        rachat2: true,
        etatCivil: "divorce",
      }),
    );
    for (const key of docs) expect(DOCUMENT_CATALOGUE[key]).toBeDefined();
  });
});

describe("computePrice", () => {
  it("charges a single person 80", () => {
    expect(computePrice(answers({ etatCivil: "celibataire" })).total).toBe(80);
  });

  it("charges a couple 120, for marriage or registered partnership", () => {
    expect(computePrice(answers({ etatCivil: "marie" })).total).toBe(120);
    expect(computePrice(answers({ etatCivil: "partenariat" })).total).toBe(120);
  });

  it("charges a student/apprentice 25, below the single rate", () => {
    expect(computePrice(answers({ revenus: { etudiant: true } })).total).toBe(25);
    // Even when married, the student rate applies…
    expect(
      computePrice(answers({ etatCivil: "marie", revenus: { etudiant: true } })).total,
    ).toBe(25);
    // …but self-employment still outranks it.
    expect(
      computePrice(answers({ revenus: { etudiant: true, independant: true } })).total,
    ).toBe(250);
  });

  it("charges the self-employed 250 instead of the personal rate", () => {
    const price = computePrice(
      answers({ etatCivil: "marie", revenus: { independant: true } }),
    );
    expect(price.total).toBe(250);
    expect(price.lines.map((l) => l.key)).toEqual(["independant"]);
  });

  it("charges per property", () => {
    const one = computePrice(
      answers({
        etatCivil: "celibataire",
        proprietaireImmeuble: "oui",
        immeubles: [],
      }),
    );
    expect(one.total).toBe(80 + 75);

    const property = {
      street: "",
      postcode: "",
      country: "",
      share: "",
      acquisition: "" as const,
      alienation: "" as const,
      rented: "" as const,
      hasDebt: "" as const,
    };
    const two = computePrice(
      answers({
        etatCivil: "celibataire",
        proprietaireImmeuble: "oui",
        immeubles: [property, property],
      }),
    );
    expect(two.total).toBe(80 + 150);
  });

  it("adds express processing and the default-assessment objection", () => {
    const price = computePrice(
      answers({
        etatCivil: "celibataire",
        express: true,
        taxationOffice: "oui",
      }),
    );
    expect(price.total).toBe(80 + 50 + 75);
  });
});

describe("assistanceTotal", () => {
  it("sums the individual options", () => {
    expect(assistanceTotal({ delai: true, suivi: true })).toBe(35);
  });

  it("never charges more than the bundle", () => {
    expect(
      assistanceTotal({
        delai: true,
        suivi: true,
        analyse: true,
        reclamation: true,
      }),
    ).toBe(75);
  });

  it("charges the bundle price when the bundle is chosen", () => {
    expect(assistanceTotal({ ensemble: true })).toBe(75);
  });

  it("is nothing when nothing is chosen", () => {
    expect(assistanceTotal({})).toBe(0);
  });
});

describe("normaliseAnswers", () => {
  it("fills in every field a stored row is missing", () => {
    const a = normaliseAnswers({ etatCivil: "marie" });
    expect(a.etatCivil).toBe("marie");
    expect(a.children).toEqual([]);
    expect(a.situation).toBe("standard");
  });

  it("survives null, a string, or nothing at all", () => {
    for (const raw of [null, undefined, "nope", 42]) {
      expect(normaliseAnswers(raw).situation).toBe("standard");
    }
  });
});
