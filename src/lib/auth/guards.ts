import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionUserByToken,
  SESSION_COOKIE_NAME,
  type SessionUser,
} from "@/lib/auth/session";
import type { Role } from "@/db/schema";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionUserByToken(token);
}

export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowed.includes(user.role)) redirect("/");
  return user;
}
