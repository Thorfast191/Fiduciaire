import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDossier } from "@/lib/dossiers";
import { getClientById } from "@/lib/adminUsers";
import { listDocumentsForDossier } from "@/lib/documents";
import { CLOSURE_CATEGORIES } from "@/lib/documentCategories";
import { documentTitle } from "@/lib/documentTitle";
import { getObjectBytes } from "@/lib/storage/client";
import { getT } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { mergeDocumentsPdf } from "@/lib/pdf/mergeDocuments";

/**
 * Streams every piece the client uploaded, merged into one PDF.
 *
 * This is the "Télécharger les pièces (PDF)" button on the admin dossier page.
 * Closure documents are excluded — those are the firm's own output, not the
 * client's supporting evidence. Administrators only, with the same reservation
 * rule as the detail page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const access = await getAccessibleDossier(id, { id: user.id, role: user.role });
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (user.role === "admin" && access.dossier.reservedBy !== user.id) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const [client, documents, { t }] = await Promise.all([
    getClientById(access.dossier.clientId),
    listDocumentsForDossier(id),
    getT(),
  ]);

  const isClosure = (cat: string) =>
    (CLOSURE_CATEGORIES as readonly string[]).includes(cat);
  // Oldest first, so the merged file reads in the order the client sent them.
  const pieces = documents.filter((doc) => !isClosure(doc.category)).reverse();

  if (pieces.length === 0) {
    return NextResponse.json({ ok: false, error: "no_documents" }, { status: 409 });
  }

  const m = t.admin.detail.mergedPdf;

  const sources = await Promise.all(
    pieces.map(async (doc) => {
      let bytes: Uint8Array | null = null;
      try {
        bytes = await getObjectBytes(doc.storageKey);
      } catch (err) {
        // One unreadable object marks a gap in the merge; it does not fail it.
        logger.warn(
          { err, documentId: doc.id, dossierId: id },
          "merge: could not read stored object",
        );
      }
      return {
        category: documentTitle(t, doc.category),
        filename: doc.filename,
        mimeType: doc.mimeType,
        bytes,
      };
    }),
  );

  const today = new Intl.DateTimeFormat("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  const merged = await mergeDocumentsPdf({
    firmName: t.admin.detail.formPdf.firmName,
    clientName: client ? `${client.firstName} ${client.lastName}`.trim() : "—",
    taxYear: String(access.dossier.taxYear),
    labels: {
      title: t.declaration.summary.docsTitle,
      client: t.admin.detail.formPdf.client,
      period: t.admin.detail.periodLabel,
      pieceCount: m.pieceCount.replace("{count}", String(pieces.length)),
      unreadable: m.unreadable,
      generated: t.admin.detail.formPdf.generated.replace("{date}", today),
    },
    sources,
  });

  const safeName = `${client?.lastName ?? "client"}-${access.dossier.taxYear}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .toLowerCase();

  return new NextResponse(new Uint8Array(merged), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pieces-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
