import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { isStrongPassword } from "@/lib/auth/passwordPolicy";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";
import { apiErrors } from "@/lib/i18n/apiErrors";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { readJsonBody } from "@/lib/http";

// Every field the signup form shows is mandatory — the fiduciary needs the full
// postal address to file a return, so there is nothing optional to collect
// later. The password is checked separately, below, to earn its own message.
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().max(200),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(50),
  street: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(120),
  // Required, and required to be true: the checkbox in the browser is a
  // convenience, this is the check that actually gates account creation.
  acceptTerms: z.literal(true),
});

export async function POST(request: NextRequest) {
  const e = apiErrors(request);
  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }
  const { email, password, firstName, lastName, phone, street, postalCode, city } =
    parsed.data;

  // A dedicated message: "check the information you entered" gives no hint that
  // it is the password, and the form shows exactly these three rules.
  if (!isStrongPassword(password)) {
    return NextResponse.json(
      { ok: false, error: e.weakPassword },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existing) {
    return NextResponse.json(
      { ok: false, error: e.emailExists },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);

  // Whatever language the visitor signed up in is the one their transactional
  // email should use from now on.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      street,
      postalCode,
      city,
      role: "client",
      locale,
      termsAcceptedAt: new Date(),
    })
    .returning();

  const code = await createOtp(user.id, "signup");
  const emailBody = otpEmailTemplate({ code, purpose: "signup", locale });
  await sendEmail({ to: user.email, ...emailBody });

  return NextResponse.json({ ok: true });
}
