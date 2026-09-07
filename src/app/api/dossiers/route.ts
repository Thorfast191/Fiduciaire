import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createDossier, listDossiersForClient } from "@/lib/dossiers";
import { readJsonBody } from "@/lib/http";
import {
  CLIENT_CREATABLE,
  SERVICE_TYPES,
  isServiceType,
  type ServiceType,
} from "@/lib/serviceTypes";
import { isActivePeriod } from "@/lib/taxPeriods";

const createBodySchema = z.object({
  // A client opening their own prestation does not send a clientId; an admin
  // opening one on someone's behalf does.
  clientId: z.string().uuid().optional(),
  taxYear: z.number().int().min(2000).max(2100),
  serviceType: z.enum(SERVICE_TYPES).optional(),
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
  const parsed = createBodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const serviceType: ServiceType = parsed.data.serviceType ?? "declaration";
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  // Clients open their own prestation requests, the way the mockup's
  // "Nouvelle demande" buttons do — but only for themselves, and never a
  // declaration: the firm opens the year's dossier when the period starts.
  if (!isAdmin) {
    if (parsed.data.clientId && parsed.data.clientId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
    if (!CLIENT_CREATABLE.includes(serviceType)) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 },
      );
    }
  } else if (!parsed.data.clientId) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  // A client can only open a request against a period the firm has opened.
  // Admins stay ungated: opening a dossier for a closed year is a legitimate
  // correction, and that is the behaviour the admin flow already relied on.
  if (!isAdmin && !(await isActivePeriod(parsed.data.taxYear))) {
    return NextResponse.json(
      { ok: false, error: "inactive_period" },
      { status: 400 },
    );
  }

  const dossier = await createDossier({
    clientId: isAdmin ? parsed.data.clientId! : user.id,
    taxYear: parsed.data.taxYear,
    serviceType,
  });

  return NextResponse.json({ ok: true, dossier });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let clientId: string;
  if (user.role === "client") {
    clientId = user.id;
  } else {
    const queryClientId = request.nextUrl.searchParams.get("clientId");
    if (!queryClientId || !z.string().uuid().safeParse(queryClientId).success) {
      return NextResponse.json(
        { ok: false, error: "clientId requis" },
        { status: 400 },
      );
    }
    clientId = queryClientId;
  }

  const rawType = request.nextUrl.searchParams.get("serviceType");
  let serviceType: ServiceType | undefined;
  if (rawType !== null) {
    if (!isServiceType(rawType)) {
      return NextResponse.json(
        { ok: false, error: "invalid_request" },
        { status: 400 },
      );
    }
    serviceType = rawType;
  }

  const dossiers = await listDossiersForClient(clientId, serviceType);
  return NextResponse.json({ ok: true, dossiers });
}
