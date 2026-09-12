/**
 * The PDF invoice layout.
 *
 * The firm needs a downloadable, numbered invoice for each payment. The
 * drawing primitives live in `./core` — a hand-rolled writer, so no PDF
 * library's weight lands in the image.
 *
 * The layout is deliberately plain: a header with the firm's details, the
 * invoice number and date, the client block, one service line with its amount,
 * a total, and a payment/VAT footer. Everything the law needs on a receipt for
 * a non-VAT-registered raison individuelle, nothing it does not.
 */

import { assemble, Canvas, COLOR, PAGE_H, PAGE_W } from "./core";

export { textWidth } from "./core";

export interface InvoiceData {
  invoiceNumber: string;
  /** Already-formatted issue date, e.g. "12.03.2026". */
  issueDate: string;
  firm: {
    name: string;
    legalForm: string;
    owner: string;
    addressLine: string;
    cityLine: string;
    email: string;
  };
  client: { name: string; email: string };
  /** The single service line. */
  service: { label: string; period: string; amountChf: number };
  /** e.g. "Carte bancaire" / "Virement". */
  method: string;
  /** Localised strings for the fixed labels. */
  labels: {
    invoice: string; // "FACTURE"
    number: string; // "N°"
    date: string; // "Date"
    billedTo: string; // "Facturé à"
    description: string; // "Description"
    amount: string; // "Montant"
    total: string; // "Total"
    paidBy: string; // "Payé par {method}"
    vatNote: string; // "TVA non applicable — ..."
    thanks: string; // "Merci de votre confiance."
  };
}

const M = 56; // page margin
const RIGHT = PAGE_W - M;

/** Render an invoice to PDF bytes. */
export function renderInvoicePdf(data: InvoiceData): Buffer {
  const c = new Canvas();
  const chf = (n: number) => `CHF ${n.toLocaleString("fr-CH")}`;

  // ---- Header: firm (left) and invoice title (right) ----
  c.text(M, 64, data.firm.name, "F2", 20, COLOR.strong);
  c.text(M, 84, `${data.firm.legalForm} · ${data.firm.owner}`, "F1", 9, COLOR.muted);
  c.text(M, 98, data.firm.addressLine, "F1", 9, COLOR.muted);
  c.text(M, 111, data.firm.cityLine, "F1", 9, COLOR.muted);
  c.text(M, 124, data.firm.email, "F1", 9, COLOR.muted);

  c.textRight(RIGHT, 66, data.labels.invoice, "F2", 22, COLOR.brand);
  c.textRight(RIGHT, 88, `${data.labels.number} ${data.invoiceNumber}`, "F1", 10, COLOR.body);
  c.textRight(RIGHT, 103, `${data.labels.date} : ${data.issueDate}`, "F1", 10, COLOR.body);

  c.line(M, 150, RIGHT, COLOR.line, 1);

  // ---- Billed to ----
  c.text(M, 178, data.labels.billedTo.toUpperCase(), "F2", 9, COLOR.muted);
  c.text(M, 196, data.client.name, "F1", 12, COLOR.strong);
  c.text(M, 212, data.client.email, "F1", 10, COLOR.muted);

  // ---- Service table ----
  const tableTop = 250;
  c.rect(M, tableTop, RIGHT - M, 26, COLOR.sunken);
  c.text(M + 12, tableTop + 17, data.labels.description, "F2", 9, COLOR.muted);
  c.textRight(RIGHT - 12, tableTop + 17, data.labels.amount, "F2", 9, COLOR.muted);

  const rowTop = tableTop + 26;
  c.text(M + 12, rowTop + 22, data.service.label, "F1", 12, COLOR.strong);
  c.text(M + 12, rowTop + 38, data.service.period, "F1", 9, COLOR.muted);
  c.textRight(RIGHT - 12, rowTop + 22, chf(data.service.amountChf), "F1", 12, COLOR.strong);
  c.line(M, rowTop + 54, RIGHT, COLOR.line, 1);

  // ---- Total ----
  const totalTop = rowTop + 54;
  c.text(M + 12, totalTop + 24, data.labels.total, "F2", 12, COLOR.strong);
  c.textRight(RIGHT - 12, totalTop + 25, chf(data.service.amountChf), "F2", 16, COLOR.brand);

  // ---- Payment + VAT note ----
  c.text(M, totalTop + 72, data.labels.paidBy, "F1", 10, COLOR.body);
  c.text(M, totalTop + 90, data.labels.vatNote, "F1", 9, COLOR.muted);

  // ---- Footer ----
  c.line(M, PAGE_H - 96, RIGHT, COLOR.line, 1);
  c.text(M, PAGE_H - 78, data.labels.thanks, "F1", 10, COLOR.body);
  c.textRight(
    RIGHT,
    PAGE_H - 78,
    `${data.firm.name} · ${data.firm.email}`,
    "F1",
    9,
    COLOR.muted,
  );

  return assemble([c.build()]);
}
