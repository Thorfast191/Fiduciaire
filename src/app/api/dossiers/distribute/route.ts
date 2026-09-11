import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { autoDistributeDossiers } from "@/lib/dossiers";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, readJsonBody } from "@/lib/http";

const bodySchema = z.object({ taxYear: z.number().int().min(2000).max(2100) });

/**
 * "Distribution automatique": spreads the period's unreserved dossiers across
 * the administrators. A super-admin power — an ordinary admin reserves dossiers
 * one at a time but does not reassign the whole pool.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  if (user.role !== "super_admin") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const { assigned } = await autoDistributeDossiers(parsed.data.taxYear);

  if (assigned > 0) {
    await writeAuditLog({
      actorUserId: user.id,
      action: "dossiers_auto_distributed",
      targetType: "period",
      metadata: { taxYear: parsed.data.taxYear, assigned },
      ip: getClientIp(request),
    });
  }

  return NextResponse.json({ ok: true, assigned });
}
