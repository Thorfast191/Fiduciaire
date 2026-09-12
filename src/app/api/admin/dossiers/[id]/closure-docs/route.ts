import { NextRequest, NextResponse } from "next/server";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { uploadDocumentDirect, MAX_SIZE_BYTES } from "@/lib/documents";
import { CLOSURE_CATEGORIES } from "@/lib/documentCategories";
import { getAccessibleDossier } from "@/lib/dossiers";

/**
 * A closure document the firm uploads at the end of a dossier — the mockup's
 * "Documents de clôture". Admin only, and the file is owned by the *client*
 * (uploadedBy the admin) so it shows up in the client's own space once the
 * dossier is closed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const access = await getAccessibleDossier(id, { id: user.id, role: user.role });
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const category = String(form.get("category") ?? "");
  const file = form.get("file");
  if (
    !(CLOSURE_CATEGORIES as readonly string[]).includes(category) ||
    !(file instanceof File)
  ) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 400 });
  }

  const result = await uploadDocumentDirect({
    // Owned by the client so it appears in their space; uploaded by the admin.
    ownerId: access.dossier.clientId,
    uploadedBy: user.id,
    dossierId: id,
    filename: file.name || "document",
    category,
    mimeType: file.type,
    body: new Uint8Array(await file.arrayBuffer()),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, documentId: result.documentId });
}
