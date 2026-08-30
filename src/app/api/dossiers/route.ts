import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createDossier, listDossiersForClient } from "@/lib/dossiers";

const createBodySchema = z.object({
  clientId: z.string().uuid(),
  taxYear: z.number().int().min(2000).max(2100),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const parsed = createBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const dossier = await createDossier({
    clientId: parsed.data.clientId,
    taxYear: parsed.data.taxYear,
  });

  return NextResponse.json({ ok: true, dossier });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let clientId: string;
  if (user.role === "client") {
    clientId = user.id;
  } else {
    const queryClientId = request.nextUrl.searchParams.get("clientId");
    if (!queryClientId || !z.string().uuid().safeParse(queryClientId).success) {
      return NextResponse.json({ ok: false, error: "clientId requis" }, { status: 400 });
    }
    clientId = queryClientId;
  }

  const dossiers = await listDossiersForClient(clientId);
  return NextResponse.json({ ok: true, dossiers });
}
