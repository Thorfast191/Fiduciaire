/**
 * The declaration questionnaire, rendered as a filing-ready form.
 *
 * "Télécharger le formulaire (PDF)" on the admin dossier page is what a
 * preparer prints or attaches when they work the file: the client's identity,
 * the tax period, every answer grouped exactly as the questionnaire grouped
 * them, the free-text remarks, the required-documents checklist ticked against
 * what actually arrived, and the computed tariff. Nothing is invented here —
 * it is the same data the screen shows, laid out for paper.
 *
 * The page breaks are driven by content: a section that will not fit in the
 * remaining space starts a new page, and a section longer than a whole page
 * spills row by row. Drawing primitives come from `./core`.
 */

import {
  assemble,
  Canvas,
  COLOR,
  PAGE_H,
  PAGE_W,
  wrapText,
} from "./core";

const M = 50; // page margin
const RIGHT = PAGE_W - M;
const CONTENT_W = RIGHT - M;
const TOP = 108; // first baseline below the running header
const BOTTOM = PAGE_H - 62; // last usable baseline, above the footer

export interface FormSection {
  title: string;
  rows: { label: string; value: string }[];
  remark?: string;
  remarkLabel?: string;
}

export interface FormDocument {
  title: string;
  received: boolean;
}

export interface DeclarationFormData {
  firm: { name: string; email: string };
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  /** e.g. "2025". */
  taxYear: string;
  /** Already-formatted, e.g. "12.03.2026", or null when never submitted. */
  submittedOn: string | null;
  canton?: string;
  status: string;
  sections: FormSection[];
  documents: FormDocument[];
  price: { label: string; amountChf: number }[];
  priceTotalChf: number;
  labels: {
    title: string; // "Déclaration d'impôts"
    period: string; // "Période fiscale"
    client: string; // "Client"
    submittedOn: string; // "Reçue le"
    status: string; // "Statut"
    canton: string; // "Canton"
    documents: string; // "Pièces justificatives"
    received: string; // "Reçu"
    missing: string; // "Manquant"
    price: string; // "Tarif calculé"
    total: string; // "Total"
    page: string; // "Page"
    of: string; // "sur"
    generated: string; // "Document généré le {date}"
    notSubmitted: string; // "Questionnaire non soumis"
  };
}

/** A page under construction: its canvas and the next free baseline. */
class Layout {
  readonly pages: Canvas[] = [];
  private current: Canvas;
  y = TOP;

  constructor(private readonly header: (c: Canvas, index: number) => void) {
    this.current = new Canvas();
    this.header(this.current, 0);
    this.pages.push(this.current);
  }

  get canvas(): Canvas {
    return this.current;
  }

  /** Start a new page when `needed` points will not fit on this one. */
  reserve(needed: number): void {
    if (this.y + needed <= BOTTOM) return;
    this.current = new Canvas();
    this.header(this.current, this.pages.length);
    this.pages.push(this.current);
    this.y = TOP;
  }
}

/** Render the declaration form to PDF bytes. */
export function renderDeclarationFormPdf(data: DeclarationFormData): Buffer {
  const chf = (n: number) => `CHF ${n.toLocaleString("fr-CH")}`;

  // The running header repeats on every page so a printed stack stays sorted.
  const header = (c: Canvas, index: number) => {
    if (index === 0) return; // the first page carries the full title block
    c.text(M, 46, data.firm.name, "F2", 11, COLOR.strong);
    c.textRight(
      RIGHT,
      46,
      `${data.client.name} · ${data.labels.period} ${data.taxYear}`,
      "F1",
      9,
      COLOR.muted,
    );
    c.line(M, 58, RIGHT, COLOR.line, 0.7);
  };

  const l = new Layout(header);

  // ---------------------------------------------------------- title block
  {
    const c = l.canvas;
    c.text(M, 58, data.firm.name, "F2", 13, COLOR.strong);
    c.textRight(RIGHT, 58, data.firm.email, "F1", 9, COLOR.muted);
    c.line(M, 70, RIGHT, COLOR.line, 0.7);

    c.text(M, 100, data.labels.title, "F2", 22, COLOR.brand);
    c.textRight(RIGHT, 100, `${data.labels.period} ${data.taxYear}`, "F2", 13, COLOR.strong);
    l.y = 116;
  }

  // ------------------------------------------------------- identity block
  {
    const c = l.canvas;
    const rows: [string, string][] = [[data.labels.client, data.client.name]];
    const contact = [data.client.email, data.client.phone].filter(Boolean).join(" · ");
    if (contact) rows.push(["", contact]);
    if (data.client.address) rows.push(["", data.client.address]);
    if (data.canton) rows.push([data.labels.canton, data.canton]);
    rows.push([data.labels.status, data.status]);
    rows.push([
      data.labels.submittedOn,
      data.submittedOn ?? data.labels.notSubmitted,
    ]);

    const boxH = rows.length * 15 + 18;
    c.rect(M, l.y, CONTENT_W, boxH, COLOR.sunken);
    let y = l.y + 21;
    for (const [label, value] of rows) {
      if (label) c.text(M + 12, y, label, "F2", 9, COLOR.muted);
      c.text(M + 120, y, value, "F1", 10, COLOR.strong);
      y += 15;
    }
    l.y += boxH + 22;
  }

  // ----------------------------------------------------- answer sections
  for (const section of data.sections) {
    // Keep a heading with at least its first two rows.
    l.reserve(24 + Math.min(section.rows.length, 2) * 16);
    l.canvas.text(M, l.y, section.title, "F2", 12, COLOR.brand);
    l.canvas.line(M, l.y + 6, RIGHT, COLOR.line, 0.7);
    l.y += 22;

    for (const row of section.rows) {
      const labelW = 190;
      const valueLines = wrapText(row.value, 10, CONTENT_W - labelW - 8);
      const rowH = Math.max(16, valueLines.length * 13 + 3);
      l.reserve(rowH);
      const c = l.canvas;
      c.text(M, l.y, row.label, "F1", 9.5, COLOR.muted);
      valueLines.forEach((line, i) => {
        c.text(M + labelW, l.y + i * 13, line, "F1", 10, COLOR.strong);
      });
      c.line(M, l.y + rowH - 5, RIGHT, COLOR.line, 0.4);
      l.y += rowH;
    }

    if (section.remark) {
      const lines = wrapText(section.remark, 9.5, CONTENT_W - 24);
      const boxH = lines.length * 12 + 26;
      l.reserve(boxH + 8);
      const c = l.canvas;
      c.rect(M, l.y - 2, CONTENT_W, boxH, COLOR.sunken);
      c.text(M + 12, l.y + 13, (section.remarkLabel ?? "").toUpperCase(), "F2", 8, COLOR.muted);
      lines.forEach((line, i) => {
        c.text(M + 12, l.y + 27 + i * 12, line, "F1", 9.5, COLOR.body);
      });
      l.y += boxH + 8;
    }

    l.y += 12;
  }

  // ------------------------------------------------ documents check-list
  if (data.documents.length > 0) {
    l.reserve(50);
    l.canvas.text(M, l.y, data.labels.documents, "F2", 12, COLOR.brand);
    l.canvas.line(M, l.y + 6, RIGHT, COLOR.line, 0.7);
    l.y += 22;

    for (const doc of data.documents) {
      l.reserve(17);
      const c = l.canvas;
      // A drawn box rather than a glyph: the standard-14 fonts have no ☑.
      c.rect(M, l.y - 8, 9, 9, doc.received ? COLOR.brand : COLOR.line);
      if (!doc.received) c.rect(M + 1, l.y - 7, 7, 7, COLOR.white);
      c.text(M + 18, l.y, doc.title, "F1", 10, COLOR.strong);
      c.textRight(
        RIGHT,
        l.y,
        doc.received ? data.labels.received : data.labels.missing,
        "F2",
        8.5,
        doc.received ? COLOR.brand : COLOR.muted,
      );
      l.y += 17;
    }
    l.y += 14;
  }

  // -------------------------------------------------------------- tariff
  if (data.price.length > 0) {
    l.reserve(48 + data.price.length * 15);
    l.canvas.text(M, l.y, data.labels.price, "F2", 12, COLOR.brand);
    l.canvas.line(M, l.y + 6, RIGHT, COLOR.line, 0.7);
    l.y += 22;

    for (const line of data.price) {
      l.reserve(15);
      l.canvas.text(M, l.y, line.label, "F1", 10, COLOR.body);
      l.canvas.textRight(RIGHT, l.y, chf(line.amountChf), "F1", 10, COLOR.strong);
      l.y += 15;
    }

    l.reserve(30);
    l.canvas.line(M, l.y - 2, RIGHT, COLOR.line, 0.7);
    l.canvas.text(M, l.y + 16, data.labels.total, "F2", 12, COLOR.strong);
    l.canvas.textRight(RIGHT, l.y + 17, chf(data.priceTotalChf), "F2", 15, COLOR.brand);
    l.y += 30;
  }

  // Page numbers can only be stamped once the total is known.
  const total = l.pages.length;
  l.pages.forEach((c, i) => {
    const label = `${data.labels.page} ${i + 1} ${data.labels.of} ${total}`;
    c.line(M, PAGE_H - 44, RIGHT, COLOR.line, 0.5);
    c.text(M, PAGE_H - 30, data.labels.generated, "F1", 8, COLOR.muted);
    c.textRight(RIGHT, PAGE_H - 30, label, "F1", 8, COLOR.muted);
  });

  return assemble(l.pages.map((c) => c.build()));
}
