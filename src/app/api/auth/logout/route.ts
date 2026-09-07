import { NextRequest, NextResponse } from "next/server";
import {
  revokeSessionByToken,
  getSessionUserByToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
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
  // A relative Location, resolved by the browser against the address it
  // actually used. `new URL("/login", request.url)` bakes in the origin Next
  // sees, which behind a reverse proxy is the internal listener — logging out
  // then sent people to http://localhost:3001/login, which resolves nowhere.
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/login" },
  });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
