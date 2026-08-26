import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Merci de vérifier les informations saisies." },
      { status: 400 },
    );
  }
  const { email, password, firstName, lastName, phone } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "Un compte existe déjà avec cette adresse e-mail." },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, firstName, lastName, phone, role: "client" })
    .returning();

  const code = await createOtp(user.id, "signup");
  const emailBody = otpEmailTemplate({ code, purpose: "signup" });
  await sendEmail({ to: user.email, ...emailBody });

  return NextResponse.json({ ok: true });
}
