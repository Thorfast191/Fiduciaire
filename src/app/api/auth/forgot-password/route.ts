import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (parsed.success) {
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
    if (user) {
      const code = await createOtp(user.id, "password_reset");
      const emailBody = otpEmailTemplate({ code, purpose: "password_reset" });
      await sendEmail({ to: user.email, ...emailBody });
    }
  }
  // Always the same response, whether or not the account exists.
  return NextResponse.json({ ok: true });
}
