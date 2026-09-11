import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { saveSubscription } from "@/lib/assistance";
import { readJsonBody } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";
import { ASSISTANCE_OPTIONS } from "@/lib/declaration";

const KEYS = ASSISTANCE_OPTIONS.map((o) => o.key) as [string, ...string[]];

const bodySchema = z.object({
  taxYear: z.number().int().min(2000).max(2100),
  services: z.array(z.enum(KEYS)).max(ASSISTANCE_OPTIONS.length),
});

/** Subscribes the signed-in client to Fiduvia Assistance for one period. */
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

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const subscription = await saveSubscription({
    clientId: user.id,
    taxYear: parsed.data.taxYear,
    services: parsed.data.services as never,
  });

  return NextResponse.json({ ok: true, subscription });
}
