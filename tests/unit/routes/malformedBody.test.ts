import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as signup } from "@/app/api/auth/signup/route";
import { POST as verifyOtp } from "@/app/api/auth/verify-otp/route";
import { POST as forgotPassword } from "@/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "@/app/api/auth/reset-password/route";
import { POST as uploadUrl } from "@/app/api/documents/upload-url/route";
import { POST as createDossier } from "@/app/api/dossiers/route";

/** A body that is not valid JSON at all. */
function badRequest(path: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: "{not json",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "9.9.9.9",
    },
  });
}

/**
 * A malformed body is a client mistake, never a server fault: these routes
 * previously threw out of `await request.json()` and surfaced as 500.
 *
 * `rejects` is false for forgot-password alone, which answers 200 to every
 * request by design so it cannot be used to enumerate accounts — the property
 * that matters there is only that it does not 5xx.
 */
describe("malformed JSON bodies never produce a 500", () => {
  const routes: [string, (r: NextRequest) => Promise<Response>, boolean][] = [
    ["/api/auth/login", login, true],
    ["/api/auth/signup", signup, true],
    ["/api/auth/verify-otp", verifyOtp, true],
    ["/api/auth/forgot-password", forgotPassword, false],
    ["/api/auth/reset-password", resetPassword, true],
    ["/api/documents/upload-url", uploadUrl, true],
    ["/api/dossiers", createDossier, true],
  ];

  for (const [path, handler, rejects] of routes) {
    it(`${path} does not 5xx${rejects ? " and rejects the request" : ""}`, async () => {
      const res = await handler(badRequest(path));

      expect(res.status).toBeLessThan(500);
      if (rejects) expect(res.status).toBeGreaterThanOrEqual(400);
    });
  }
});
