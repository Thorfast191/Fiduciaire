import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dossierComments, users, type DossierComment } from "@/db/schema";

export interface CommentRow {
  id: string;
  body: string;
  createdAt: Date;
  authorName: string;
}

/** The internal team comments on a dossier, oldest first, with author names. */
export async function listComments(dossierId: string): Promise<CommentRow[]> {
  const rows = await db
    .select({
      id: dossierComments.id,
      body: dossierComments.body,
      createdAt: dossierComments.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(dossierComments)
    .innerJoin(users, eq(users.id, dossierComments.authorId))
    .where(eq(dossierComments.dossierId, dossierId))
    .orderBy(asc(dossierComments.createdAt));

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    authorName: `${r.firstName} ${r.lastName}`.trim(),
  }));
}

/** Adds one internal comment, returning the stored row. */
export async function addComment(
  dossierId: string,
  authorId: string,
  body: string,
): Promise<DossierComment> {
  const [row] = await db
    .insert(dossierComments)
    .values({ dossierId, authorId, body })
    .returning();
  return row;
}

/** Deletes a comment, but only one the requester wrote. */
export async function deleteComment(
  id: string,
  authorId: string,
): Promise<boolean> {
  const rows = await db
    .delete(dossierComments)
    .where(and(eq(dossierComments.id, id), eq(dossierComments.authorId, authorId)))
    .returning({ id: dossierComments.id });
  return rows.length > 0;
}
