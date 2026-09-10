/**
 * A dependency-free PDF invoice writer.
 *
 * The firm needs a downloadable, numbered invoice for each payment. Rather than
 * pull in a PDF library (and its weight into the image), this emits a single A4
 * page by hand using the two standard-14 fonts (Helvetica / Helvetica-Bold),
 * which need no embedding. Text is encoded to WinAnsi — the encoding those
 * fonts declare — so Swiss French accents (Châtel-St-Denis, déclaration) and
 * curly punctuation render correctly.
 *
 * The layout is deliberately plain: a header with the firm's details, the
 * invoice number and date, the client block, one service line with its amount,
 * a total, and a payment/VAT footer. Everything the law needs on a receipt for
 * a non-VAT-registered raison individuelle, nothing it does not.
 */

// Helvetica character widths (1000-unit em), AFM standard, for the WinAnsi
// code points we can emit. Used to right-align amounts and center the title.
// Accented letters are measured as their base letter, which is exact for
// Helvetica (é and e share a width), so no separate table is needed.
const HELV_WIDTH: Record<number, number> = {
  32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191,
  40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
  48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556,
  56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556,
  64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
  72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778,
  80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944,
  88: 667, 89: 667, 90: 611, 91: 278, 92: 278, 93: 278, 94: 469, 95: 556,
  96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556,
  104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556,
  111: 556, 112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556,
  118: 500, 119: 722, 120: 500, 121: 500, 122: 500, 123: 334, 124: 260,
  125: 334, 126: 584,
};

// Unicode → WinAnsi byte, for the characters that fall outside plain Latin-1
// (CP1252's 0x80–0x9F band: smart quotes, dashes, ellipsis, euro).
const WINANSI_SPECIAL: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

/** Map a code point to its WinAnsi byte, or '?' when it cannot be represented. */
function toWinAnsiByte(cp: number): number {
  if (cp <= 0xff) return cp; // Latin-1 range maps 1:1 into WinAnsi
  return WINANSI_SPECIAL[cp] ?? 0x3f; // '?'
}

/** Width of a Helvetica byte, using the base-letter width for accented chars. */
function byteWidth(b: number): number {
  if (HELV_WIDTH[b] !== undefined) return HELV_WIDTH[b];
  // Accented Latin-1 letters share their base letter's width.
  const ch = String.fromCharCode(b)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const base = ch.charCodeAt(0);
  return HELV_WIDTH[base] ?? 556;
}

/** Encode a string to WinAnsi bytes and escape it as a PDF literal string. */
function pdfString(s: string): string {
  let out = "";
  for (const ch of s) {
    const b = toWinAnsiByte(ch.codePointAt(0)!);
    if (b === 0x28) out += "\\("; // (
    else if (b === 0x29) out += "\\)"; // )
    else if (b === 0x5c) out += "\\\\"; // backslash
    else if (b < 0x20) out += " ";
    else out += String.fromCharCode(b);
  }
  return out;
}

/** Width of a WinAnsi string at a given point size. */
export function textWidth(s: string, size: number): number {
  let w = 0;
  for (const ch of s) w += byteWidth(toWinAnsiByte(ch.codePointAt(0)!));
  return (w / 1000) * size;
}

type Font = "F1" | "F2"; // Helvetica, Helvetica-Bold
type RGB = [number, number, number];

const COLOR = {
  strong: [0.059, 0.165, 0.247] as RGB,
  body: [0.173, 0.227, 0.259] as RGB,
  muted: [0.502, 0.486, 0.447] as RGB,
  brand: [0.106, 0.431, 0.494] as RGB,
  line: [0.83, 0.82, 0.78] as RGB,
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;

/** Accumulates a PDF content stream in points from the top-left. */
class Canvas {
  private ops: string[] = [];

  text(x: number, yTop: number, s: string, font: Font, size: number, color: RGB) {
    const y = PAGE_H - yTop;
    this.ops.push(
      `${color[0]} ${color[1]} ${color[2]} rg`,
      "BT",
      `/${font} ${size} Tf`,
      `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
      `(${pdfString(s)}) Tj`,
      "ET",
    );
  }

  textRight(xRight: number, yTop: number, s: string, font: Font, size: number, color: RGB) {
    this.text(xRight - textWidth(s, size), yTop, s, font, size, color);
  }

  line(x1: number, yTop: number, x2: number, color: RGB, width = 1) {
    const y = PAGE_H - yTop;
    this.ops.push(
      `${color[0]} ${color[1]} ${color[2]} RG`,
      `${width} w`,
      `${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`,
    );
  }

  rect(x: number, yTop: number, w: number, h: number, color: RGB) {
    const y = PAGE_H - yTop - h;
    this.ops.push(
      `${color[0]} ${color[1]} ${color[2]} rg`,
      `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`,
    );
  }

  build(): string {
    return this.ops.join("\n");
  }
}

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
  c.rect(M, tableTop, RIGHT - M, 26, [0.965, 0.945, 0.905]);
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

  return assemble(c.build());
}

/** Wrap a content stream in the minimal object graph and xref of a PDF file. */
function assemble(content: string): Buffer {
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefPos = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
