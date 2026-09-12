import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { wrapText } from "@/lib/pdf/core";
import {
  renderDeclarationFormPdf,
  type DeclarationFormData,
} from "@/lib/pdf/declarationForm";
import { mergeDocumentsPdf } from "@/lib/pdf/mergeDocuments";

const LABELS: DeclarationFormData["labels"] = {
  title: "Déclaration d'impôts",
  period: "Période fiscale",
  client: "Client",
  submittedOn: "Reçue le",
  status: "Statut",
  canton: "Canton",
  documents: "Pièces justificatives",
  received: "Reçu",
  missing: "Manquant",
  price: "Tarif calculé",
  total: "Total",
  page: "Page",
  of: "sur",
  generated: "Document généré le 12.03.2026",
  notSubmitted: "Questionnaire non soumis",
};

function sample(
  overrides: Partial<DeclarationFormData> = {},
): DeclarationFormData {
  return {
    firm: { name: "Fiduvia", email: "contact@fiduvia.ch" },
    client: {
      name: "Jérôme Müller",
      email: "jerome@example.test",
      phone: "+41 79 123 45 67",
      address: "Route de la Pontille 28, 1618 Châtel-St-Denis",
    },
    taxYear: "2025",
    submittedOn: "08.04.2026",
    canton: "Vaud",
    status: "Pièces reçues",
    sections: [
      {
        title: "Situation",
        rows: [
          { label: "Canton", value: "Vaud" },
          { label: "État civil", value: "Marié(e)" },
        ],
        remark: "Le client a déménagé en cours d'année.",
        remarkLabel: "Remarque",
      },
    ],
    documents: [
      { title: "Certificat de salaire", received: true },
      { title: "Relevés bancaires", received: false },
    ],
    price: [{ label: "Déclaration de base", amountChf: 120 }],
    priceTotalChf: 120,
    labels: LABELS,
    ...overrides,
  };
}

/** Read a PDF back with a real parser rather than trusting our own writer. */
async function parse(bytes: Buffer | Uint8Array) {
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

describe("wrapText", () => {
  it("keeps every line inside the requested width", () => {
    const text =
      "Le client a déménagé en cours d'année et souhaite répartir la déduction.";
    const lines = wrapText(text, 10, 120);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      // Re-measure with the same table the wrapper used.
      expect(wrapText(line, 10, 120)).toHaveLength(1);
    }
  });

  it("breaks a single word that cannot fit", () => {
    const lines = wrapText("CH9300762011623852957CH9300762011623852957", 10, 60);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("preserves explicit line breaks", () => {
    expect(wrapText("un\ndeux", 10, 200)).toEqual(["un", "deux"]);
  });
});

describe("renderDeclarationFormPdf", () => {
  it("emits a PDF a real parser can open", async () => {
    const pdf = renderDeclarationFormPdf(sample());
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    const doc = await parse(pdf);
    expect(doc.getPageCount()).toBe(1);
  });

  it("spills onto more pages as the content grows", async () => {
    const rows = Array.from({ length: 90 }, (_, i) => ({
      label: `Ligne ${i + 1}`,
      value: "Une valeur suffisamment longue pour occuper la colonne de droite",
    }));
    const pdf = renderDeclarationFormPdf(
      sample({ sections: [{ title: "Revenus", rows }] }),
    );
    const doc = await parse(pdf);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("says so when the questionnaire was never submitted", () => {
    const pdf = renderDeclarationFormPdf(sample({ submittedOn: null }));
    expect(pdf.toString("latin1")).toContain("Questionnaire non soumis");
  });

  it("writes accented French through WinAnsi, not as question marks", () => {
    const pdf = renderDeclarationFormPdf(sample()).toString("latin1");
    // "Déclaration" — the é is a single WinAnsi byte, 0xE9.
    expect(pdf).toContain("Déclaration");
  });
});

describe("mergeDocumentsPdf", () => {
  const labels = {
    title: "Pièces justificatives",
    client: "Client",
    period: "Période fiscale",
    pieceCount: "2 pièce(s)",
    unreadable: "Pièce illisible",
    generated: "Document généré le 12.03.2026",
  };

  /** A one-pixel PNG, the smallest valid image pdf-lib will embed. */
  const PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  it("copies every page of an uploaded PDF through", async () => {
    const twoPages = await PDFDocument.create();
    twoPages.addPage();
    twoPages.addPage();
    const bytes = await twoPages.save();

    const merged = await mergeDocumentsPdf({
      firmName: "Fiduvia",
      clientName: "Jérôme Müller",
      taxYear: "2025",
      labels,
      sources: [
        {
          category: "Certificat de salaire",
          filename: "salaire.pdf",
          mimeType: "application/pdf",
          bytes,
        },
      ],
    });

    // Cover + separator + the two copied pages.
    expect((await parse(merged)).getPageCount()).toBe(4);
  });

  it("turns an image into a page of its own", async () => {
    const merged = await mergeDocumentsPdf({
      firmName: "Fiduvia",
      clientName: "Jérôme Müller",
      taxYear: "2025",
      labels,
      sources: [
        {
          category: "Justificatif",
          filename: "photo.png",
          mimeType: "image/png",
          bytes: PNG,
        },
      ],
    });
    expect((await parse(merged)).getPageCount()).toBe(3);
  });

  it("marks a missing or corrupt piece instead of failing the merge", async () => {
    const merged = await mergeDocumentsPdf({
      firmName: "Fiduvia",
      clientName: "Jérôme Müller",
      taxYear: "2025",
      labels,
      sources: [
        {
          category: "Manquant",
          filename: "absent.pdf",
          mimeType: "application/pdf",
          bytes: null,
        },
        {
          category: "Corrompu",
          filename: "casse.pdf",
          mimeType: "application/pdf",
          bytes: Buffer.from("not a pdf at all"),
        },
      ],
    });
    // Cover plus one separator per piece; neither piece added content pages.
    expect((await parse(merged)).getPageCount()).toBe(3);
  });
});
