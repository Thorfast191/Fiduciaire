import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { autoDistributeDossiers, distributeDossiers } from "@/lib/dossiers";
import { SERVICE_TYPES } from "@/lib/serviceTypes";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, readJsonBody } from "@/lib/http";

// Two shapes, one endpoint. Without `allocations` this is the one-click
// "Distribution automatique" that spreads everything evenly; with them it is
// the wizard, handing each named admin a chosen number per prestation.
const bodySchema = z.object({
  taxYear: z.number().int().min(2000).max(2100),
  allocations: z
    .array(
      z.object({
        adminId: z.string().uuid(),
        serviceType: z.enum(SERVICE_TYPES),
        count: z.number().int().min(0).max(500),
      }),
    )
    .max(200)
    .optional(),
});

/**
 * Distributing the period's unreserved dossiers across the administrators. A
 * super-admin power — an ordinary admin reserves dossiers one at a time but
 * does not reassign the whole pool.
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
  if (user.role !== "admin" && user.role !== "super_admin") {
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

  // Naming who receives what is the super admin's call. An ordinary admin gets
  // the even split only, which is the button the reference shows them.
  if (parsed.data.allocations && user.role !== "super_admin") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const { taxYear, allocations } = parsed.data;
  const { assigned } = allocations
    ? await distributeDossiers(taxYear, allocations)
    : await autoDistributeDossiers(taxYear);

  if (assigned > 0) {
    await writeAuditLog({
      actorUserId: user.id,
      action: allocations
        ? "dossiers_distributed"
        : "dossiers_auto_distributed",
      targetType: "period",
      metadata: { taxYear, assigned },
      ip: getClientIp(request),
    });
  }

  return NextResponse.json({ ok: true, assigned });
}
