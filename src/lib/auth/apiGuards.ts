import type { NextRequest } from "next/server";
import {
  getSessionUserByToken,
  SESSION_COOKIE_NAME,
  type SessionUser,
} from "@/lib/auth/session";

export type AdminAuth =
  | { user: SessionUser }
  | { error: "unauthorized" | "forbidden"; status: 401 | 403 };

/**
 * Resolves the caller and requires an administrator.
 *
 * Route handlers run outside the middleware's protected-path check — that only
 * covers page routes — so each one authorises for itself. Returning the reason
 * rather than throwing lets the caller pick the status and the message.
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuth> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;

  if (!user) return { error: "unauthorized", status: 401 };
  if (user.role !== "admin" && user.role !== "super_admin") {
    return { error: "forbidden", status: 403 };
  }
  return { user };
}
