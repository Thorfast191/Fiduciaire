import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDossier } from "@/lib/dossiers";
import { confirmCheckoutById } from "@/lib/checkout";
import { apiErrors } from "@/lib/i18n/apiErrors";
import { readJsonBody } from "@/lib/http";

const bodySchema = z.object({ sessionId: z.string().min(1).max(200) });

/**
 * Confirms a Checkout session on return from Stripe (the success redirect).
 *
 * A safety net for the webhook, not a replacement: it retrieves the session
 * straight from Stripe and settles it if paid, so a client's file is submitted
 * even if the webhook is slow or not yet configured. `finalizeCheckoutSession`
 * is idempotent, so the webhook and this route settling the same session is
 * fine. The session must belong to this dossier, so one client cannot finalize
 * another's payment.
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
    return NextResponse.json({ ok: false, error: e.dossierNotFound }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const { finalized, dossierId } = await confirmCheckoutById(parsed.data.sessionId);
    if (dossierId && dossierId !== id) {
      // The session is for a different dossier than the one in the URL.
      return NextResponse.json({ ok: false, error: e.dossierNotFound }, { status: 404 });
    }
    return NextResponse.json({ ok: true, finalized });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
}
