/**
 * Merges a dossier's uploaded pieces into one PDF.
 *
 * "Télécharger les pièces (PDF)" gives a preparer a single file to work from
 * instead of a folder of downloads. The demo only pretends to do this — it
 * draws a card bearing each filename and keeps no bytes — so this is a real
 * merge: every page of an uploaded PDF is copied through, and a JPEG or PNG
 * becomes a page of its own, scaled to fit A4 with a margin.
 *
 * Each piece is preceded by a separator line naming its category and original
 * filename, so the merged file reads like the checklist on screen. A piece
 * whose bytes are missing or unreadable does not fail the download: it becomes
 * a page saying so, because a preparer needs to see the gap rather than a 500.
 *
 * `pdf-lib` is used rather than the hand-rolled writer in `./core`: copying
 * pages out of an arbitrary client-supplied PDF means parsing cross-reference
 * streams and object streams, which is not something to hand-roll.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 36;

export interface MergeSource {
  /** The catalogue title, e.g. "Certificat de salaire". */
  category: string;
  filename: string;
  mimeType: string;
  /** Null when the object could not be read from storage. */
  bytes: Uint8Array | null;
}

export interface MergeLabels {
  /** Cover-page title, e.g. "Pièces justificatives". */
  title: string;
  client: string;
  period: string;
  /** "N pièce(s)" — the caller formats the count. */
  pieceCount: string;
  /** Shown on the page that stands in for an unreadable piece. */
  unreadable: string;
  generated: string;
}

export interface MergeInput {
  firmName: string;
  clientName: string;
  taxYear: string;
  labels: MergeLabels;
  sources: MergeSource[];
}

/** Merge the pieces into one PDF and return its bytes. */
export async function mergeDocumentsPdf(input: MergeInput): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const helv = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.106, 0.431, 0.494);
  const strong = rgb(0.059, 0.165, 0.247);
  const muted = rgb(0.502, 0.486, 0.447);
  const line = rgb(0.83, 0.82, 0.78);

  // ------------------------------------------------------------ cover page
  {
    const page = out.addPage(A4);
    const { width, height } = page.getSize();
    page.drawText(input.firmName, {
      x: MARGIN, y: height - 60, size: 13, font: bold, color: strong,
    });
    page.drawLine({
      start: { x: MARGIN, y: height - 72 },
      end: { x: width - MARGIN, y: height - 72 },
      thickness: 0.7,
      color: line,
    });
    page.drawText(input.labels.title, {
      x: MARGIN, y: height - 118, size: 22, font: bold, color: brand,
    });

    const rows: [string, string][] = [
      [input.labels.client, input.clientName],
      [input.labels.period, input.taxYear],
      ["", input.labels.pieceCount],
    ];
    let y = height - 160;
    for (const [label, value] of rows) {
      if (label) {
        page.drawText(label, { x: MARGIN, y, size: 9, font: bold, color: muted });
      }
      page.drawText(value, { x: MARGIN + 110, y, size: 11, font: helv, color: strong });
      y -= 18;
    }

    y -= 14;
    for (const source of input.sources) {
      page.drawText(`•  ${source.category}`, {
        x: MARGIN, y, size: 10, font: helv, color: strong,
      });
      page.drawText(source.filename, {
        x: MARGIN + 200, y, size: 9, font: helv, color: muted,
      });
      y -= 15;
      if (y < MARGIN + 40) break; // the list is a courtesy, not the content
    }

    page.drawText(input.labels.generated, {
      x: MARGIN, y: MARGIN, size: 8, font: helv, color: muted,
    });
  }

  // ------------------------------------------------------------ the pieces
  for (const source of input.sources) {
    const separator = out.addPage(A4);
    const { width, height } = separator.getSize();
    separator.drawText(source.category, {
      x: MARGIN, y: height / 2, size: 18, font: bold, color: brand,
    });
    separator.drawText(source.filename, {
      x: MARGIN, y: height / 2 - 22, size: 10, font: helv, color: muted,
    });
    separator.drawLine({
      start: { x: MARGIN, y: height / 2 - 36 },
      end: { x: width - MARGIN, y: height / 2 - 36 },
      thickness: 0.7,
      color: line,
    });

    if (!source.bytes) {
      separator.drawText(input.labels.unreadable, {
        x: MARGIN, y: height / 2 - 58, size: 10, font: helv, color: strong,
      });
      continue;
    }

    try {
      await appendPiece(out, source);
    } catch {
      // A corrupt or encrypted upload must not take the whole download down.
      separator.drawText(input.labels.unreadable, {
        x: MARGIN, y: height / 2 - 58, size: 10, font: helv, color: strong,
      });
    }
  }

  return out.save();
}

/** Copy one piece into the output: PDF pages verbatim, images as full pages. */
async function appendPiece(out: PDFDocument, source: MergeSource): Promise<void> {
  const type = source.mimeType.split(";")[0].trim().toLowerCase();

  if (type === "application/pdf") {
    // `ignoreEncryption` lets an owner-password-protected but readable file
    // through; a genuinely encrypted one throws and the caller marks the gap.
    const src = await PDFDocument.load(source.bytes!, { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
    return;
  }

  const image =
    type === "image/png"
      ? await out.embedPng(source.bytes!)
      : await out.embedJpg(source.bytes!);

  // Fit inside the A4 margins, rotating a landscape photo so it fills the page.
  const landscape = image.width > image.height;
  const boxW = (landscape ? A4[1] : A4[0]) - MARGIN * 2;
  const boxH = (landscape ? A4[0] : A4[1]) - MARGIN * 2;
  const scale = Math.min(boxW / image.width, boxH / image.height, 1);
  const w = image.width * scale;
  const h = image.height * scale;

  const page = out.addPage(A4);
  if (landscape) {
    // Draw rotated a quarter turn: the origin moves to the bottom-right of
    // where the image should land, and width/height swap in page space.
    page.drawImage(image, {
      x: (A4[0] + h) / 2,
      y: (A4[1] - w) / 2,
      width: w,
      height: h,
      rotate: degrees(90),
    });
  } else {
    page.drawImage(image, {
      x: (A4[0] - w) / 2,
      y: (A4[1] - h) / 2,
      width: w,
      height: h,
    });
  }
}
