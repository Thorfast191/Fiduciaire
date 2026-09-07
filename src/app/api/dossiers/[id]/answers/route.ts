import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dossiers } from "@/db/schema";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDossier } from "@/lib/dossiers";
import { readJsonBody } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";
import { STEPS, normaliseAnswers } from "@/lib/declaration";

const bodySchema = z.object({
  // The whole answers object each time. It is one form spread over seven
  // pages, and a partial patch would need a merge strategy per field for no
  // benefit — the payload is small and the client always holds the full state.
  answers: z.record(z.unknown()),
  currentStep: z.number().int().min(0).max(STEPS.length - 1).optional(),
});

/**
 * Saves the declaration questionnaire.
 *
 * Only the owning client may write, and only while the dossier is still theirs
 * to fill in: once it has been submitted the answers are the record the firm is
 * working from, so later edits would silently change what was agreed.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const e = apiErrors(request);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { ok: false, error: e.dossierNotFound },
      { status: 404 },
    );
  }

  const access = await getAccessibleDossier(id, {
    id: user.id,
    role: user.role,
  });
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: e.dossierNotFound },
      { status: 404 },
    );
  }

  if (access.dossier.clientId !== user.id) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  if (access.dossier.status !== "not_started") {
    return NextResponse.json(
      { ok: false, error: e.invalidTransition },
      { status: 409 },
    );
  }

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const answers = normaliseAnswers(parsed.data.answers);

  await db
    .update(dossiers)
    .set({
      answers,
      ...(parsed.data.currentStep !== undefined
        ? { currentStep: parsed.data.currentStep }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(dossiers.id, id));

  return NextResponse.json({ ok: true, answers });
}
