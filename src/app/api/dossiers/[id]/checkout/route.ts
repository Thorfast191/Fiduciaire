import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDossier } from "@/lib/dossiers";
import { createDossierCheckout } from "@/lib/checkout";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

/**
 * Opens a Stripe Checkout session so the client can pay for and submit their
 * declaration, and returns the URL for the browser to redirect to. Only the
 * owning client may start it; the amount is computed server-side from the
 * stored answers inside `createDossierCheckout`.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const e = apiErrors(request);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: e.dossierNotFound }, { status: 404 });
  }

  const access = await getAccessibleDossier(id, { id: user.id, role: user.role });
  if (!access.ok || access.dossier.clientId !== user.id) {
    // Only the owning client pays; an admin has no checkout to run.
    return NextResponse.json({ ok: false, error: e.dossierNotFound }, { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const result = await createDossierCheckout({
    dossier: access.dossier,
    user: { id: user.id, email: user.email },
    productName: `Déclaration d'impôts ${access.dossier.taxYear} — Fiduvia`,
    successUrl: `${origin}/portal/dossiers/${id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/portal/dossiers/${id}?checkout=cancelled`,
  });

  if (!result.ok) {
    const status = result.error === "not_configured" ? 503 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "checkout_started",
    targetType: "dossier",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true, url: result.url });
}
