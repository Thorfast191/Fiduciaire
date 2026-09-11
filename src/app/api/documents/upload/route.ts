import { NextRequest, NextResponse } from "next/server";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  uploadDocumentDirect,
  DOCUMENT_CATEGORIES,
  MAX_SIZE_BYTES,
} from "@/lib/documents";
import { getAccessibleDossier } from "@/lib/dossiers";

const GENERIC_NOT_FOUND = "Dossier introuvable.";

/**
 * App-proxied upload: the browser POSTs the file here (multipart) and the
 * server streams it to S3, so there is no browser→S3 cross-origin PUT and no
 * bucket CORS to configure. Replaces the old presign + PUT + confirm dance for
 * the client-facing forms.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (user.role !== "client") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const dossierId = String(form.get("dossierId") ?? "");
  const category = String(form.get("category") ?? "");
  const file = form.get("file");

  if (
    !dossierId ||
    !(DOCUMENT_CATEGORIES as readonly string[]).includes(category) ||
    !(file instanceof File)
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }
  if (file.size <= 0 || file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 400 });
  }

  const dossierCheck = await getAccessibleDossier(dossierId, {
    id: user.id,
    role: user.role,
  });
  if (!dossierCheck.ok) {
    return NextResponse.json(
      { ok: false, error: GENERIC_NOT_FOUND },
      { status: 404 },
    );
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const result = await uploadDocumentDirect({
    ownerId: user.id,
    uploadedBy: user.id,
    dossierId,
    filename: file.name || "document",
    category,
    mimeType: file.type,
    body,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, documentId: result.documentId });
}
