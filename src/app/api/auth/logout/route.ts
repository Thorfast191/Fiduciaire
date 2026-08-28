import { NextRequest, NextResponse } from "next/server";
import { revokeSessionByToken, getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const user = await getSessionUserByToken(token);
    await revokeSessionByToken(token);
    if (user) {
      await writeAuditLog({
        actorUserId: user.id,
        action: "logout",
        ip: getClientIp(request),
      });
    }
  }
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
