import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  createTaxPeriod,
  listTaxPeriods,
  setTaxPeriodActive,
} from "@/lib/taxPeriods";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

const createSchema = z.object({
  year: z.number().int().min(2000).max(2100),
});

const patchSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  isActive: z.boolean(),
});

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) return { error: "unauthorized" as const, status: 401 };
  if (user.role !== "admin" && user.role !== "super_admin") {
    return { error: "forbidden" as const, status: 403 };
  }
  return { user };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  return NextResponse.json({ ok: true, periods: await listTaxPeriods() });
}

export async function POST(request: NextRequest) {
  const e = apiErrors(request);
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const result = await createTaxPeriod(parsed.data.year);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: e.periodExists },
      { status: 409 },
    );
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "tax_period_created",
    ip: getClientIp(request),
    metadata: { year: parsed.data.year },
  });

  return NextResponse.json({ ok: true, period: result.period });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const period = await setTaxPeriodActive(
    parsed.data.year,
    parsed.data.isActive,
  );
  if (!period) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: parsed.data.isActive
      ? "tax_period_activated"
      : "tax_period_deactivated",
    ip: getClientIp(request),
    metadata: { year: parsed.data.year },
  });

  return NextResponse.json({ ok: true, period });
}
