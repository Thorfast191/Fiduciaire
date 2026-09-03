import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createPendingUpload, DOCUMENT_CATEGORIES } from "@/lib/documents";
import { getAccessibleDossier } from "@/lib/dossiers";

const GENERIC_NOT_FOUND = "Dossier introuvable.";

const bodySchema = z.object({
  dossierId: z.string().uuid(),
  filename: z.string().min(1).max(255),
  category: z.enum(DOCUMENT_CATEGORIES),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  if (user.role !== "client") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const dossierCheck = await getAccessibleDossier(parsed.data.dossierId, {
    id: user.id,
    role: user.role,
  });
  if (!dossierCheck.ok) {
    return NextResponse.json(
      { ok: false, error: GENERIC_NOT_FOUND },
      { status: 404 },
    );
  }

  const result = await createPendingUpload({
    ownerId: user.id,
    uploadedBy: user.id,
    dossierId: parsed.data.dossierId,
    filename: parsed.data.filename,
    category: parsed.data.category,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    documentId: result.documentId,
    uploadUrl: result.uploadUrl,
  });
}
