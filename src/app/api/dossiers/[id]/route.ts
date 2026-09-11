import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDossier, deleteDossier } from "@/lib/dossiers";
import { listDocumentsForDossier } from "@/lib/documents";

const GENERIC_NOT_FOUND = "Dossier introuvable.";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { ok: false, error: GENERIC_NOT_FOUND },
      { status: 404 },
    );
  }

  const result = await getAccessibleDossier(id, {
    id: user.id,
    role: user.role,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: GENERIC_NOT_FOUND },
      { status: 404 },
    );
  }

  const docs = await listDocumentsForDossier(id);
  return NextResponse.json({
    ok: true,
    dossier: result.dossier,
    documents: docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      category: d.category,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt,
    })),
  });
}

/**
 * Deletes a draft dossier. Only its owner (or an admin) may delete, and only
 * while it is still `not_started` — the library enforces both and a mismatch
 * comes back as `not_found` (wrong owner) or `not_deletable` (already
 * submitted), which map to 404 and 409 here.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { ok: false, error: GENERIC_NOT_FOUND },
      { status: 404 },
    );
  }

  const result = await deleteDossier(id, { id: user.id, role: user.role });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: GENERIC_NOT_FOUND },
      { status: result.error === "not_deletable" ? 409 : 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
