import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import { contactEmailTemplate } from "@/lib/email/templates/contactEmail";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { env } from "@/lib/env";
import { apiErrors } from "@/lib/i18n/apiErrors";

const bodySchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

/**
 * Contact form for signed-in clients. The sender identity comes from the
 * session, never the request body, so this cannot be used as an open relay or
 * to spoof another client.
 */
export async function POST(request: NextRequest) {
  const e = apiErrors(request);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const body = contactEmailTemplate({
    fromName: `${user.firstName} ${user.lastName}`.trim(),
    fromEmail: user.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  await sendEmail({ to: env.CONTACT_EMAIL, ...body });

  await writeAuditLog({
    actorUserId: user.id,
    action: "contact_message_sent",
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
