import { NextRequest, NextResponse } from "next/server";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { listDocumentsForOwner } from "@/lib/documents";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let ownerId: string;
  if (user.role === "client") {
    ownerId = user.id;
  } else {
    const clientId = request.nextUrl.searchParams.get("clientId");
    if (!clientId) {
      return NextResponse.json({ ok: false, error: "clientId requis" }, { status: 400 });
    }
    ownerId = clientId;
  }

  const docs = await listDocumentsForOwner(ownerId);
  return NextResponse.json({
    ok: true,
    documents: docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt,
    })),
  });
}
