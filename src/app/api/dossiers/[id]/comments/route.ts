import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { addComment, deleteComment } from "@/lib/comments";
import { readJsonBody } from "@/lib/http";

const addSchema = z.object({ body: z.string().trim().min(1).max(4000) });
const deleteSchema = z.object({ commentId: z.string().uuid() });

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) return { error: "unauthorized" as const, status: 401 };
  if (user.role !== "admin" && user.role !== "super_admin") {
    return { error: "forbidden" as const, status: 403 };
  }
  return { user };
}

/** Add an internal team comment to a dossier. Admins only. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const parsed = addSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const comment = await addComment(id, auth.user.id, parsed.data.body);
  return NextResponse.json({ ok: true, id: comment.id });
}

/** Remove one of your own comments. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }
  await params; // dossier id is implied by the comment; nothing else needed
  const parsed = deleteSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const removed = await deleteComment(parsed.data.commentId, auth.user.id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
