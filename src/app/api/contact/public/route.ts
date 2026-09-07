import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { publicContactEmailTemplate } from "@/lib/email/templates/publicContactEmail";
import { isPublicContactRateLimited } from "@/lib/auth/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, readJsonBody } from "@/lib/http";
import { env } from "@/lib/env";
import { apiErrors } from "@/lib/i18n/apiErrors";

const bodySchema = z.object({
  lastName: z.string().trim().min(1).max(100),
  firstName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().default(""),
  message: z.string().trim().min(1).max(5000),
});

/**
 * The marketing site's contact form, which anonymous visitors can use.
 *
 * The recipient is always `CONTACT_EMAIL` — never an address from the request —
 * so this cannot be turned into an open relay; the sender's details travel in
 * the body of the message, not in the envelope. Submissions are capped per IP.
 */
export async function POST(request: NextRequest) {
  const e = apiErrors(request);
  const ip = getClientIp(request);

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  if (await isPublicContactRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: e.tooManyRequests },
      { status: 429 },
    );
  }

  const { lastName, firstName, email, phone, message } = parsed.data;

  const body = publicContactEmailTemplate({
    firstName,
    lastName,
    email,
    phone,
    message,
  });

  await sendEmail({ to: env.CONTACT_EMAIL, ...body });

  await writeAuditLog({
    action: "public_contact_sent",
    ip,
  });

  return NextResponse.json({ ok: true });
}
