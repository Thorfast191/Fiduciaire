import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as signup } from "../../../src/app/api/auth/signup/route";
import { POST as login } from "../../../src/app/api/auth/login/route";

/**
 * A fresh IP per run.
 *
 * The login limiter counts `login_failed` rows in `audit_log` per IP over a
 * rolling 15 minutes, and that table only grows — with fixed IPs, running this
 * suite a few times in a quarter of an hour makes the limiter fire inside
 * tests that are not about rate limiting, and they fail on the wrong message.
 */
let ipCounter = 0;
const ipRun = Math.floor(Math.random() * 250) + 1;
function uniqueIp(): string {
  ipCounter += 1;
  return `20.${ipRun}.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

function req(path: string, body: unknown, ip = "127.0.0.1") {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

async function makeAccount(ip: string) {
  const email = `login-${Date.now()}-${Math.random()}@example.test`;
  const password = "a-long-enough-password";
  await signup(
    req("/api/auth/signup", { email, password, firstName: "A", lastName: "B" }, ip),
  );
  return { email, password };
}

describe("POST /api/auth/login", () => {
  it("accepts correct credentials and does not error", async () => {
    const ip = uniqueIp();
    const { email, password } = await makeAccount(ip);
    const res = await login(req("/api/auth/login", { email, password }, ip));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rejects an incorrect password with a generic message", async () => {
    const ip = uniqueIp();
    const { email } = await makeAccount(ip);
    const res = await login(
      req("/api/auth/login", { email, password: "wrong-password" }, ip),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).not.toMatch(/password/i);
  });

  it("rejects an unknown email with the same generic message as a wrong password", async () => {
    const ip = uniqueIp();
    const unknown = await login(
      req(
        "/api/auth/login",
        { email: "nobody@example.test", password: "whatever123" },
        ip,
      ),
    );
    const wrongPw = await (async () => {
      const { email } = await makeAccount(ip);
      return login(req("/api/auth/login", { email, password: "wrong" }, ip));
    })();
    expect((await unknown.json()).error).toBe((await wrongPw.json()).error);
  });

  it("rate-limits after 5 failed attempts from the same email+ip", async () => {
    const ip = uniqueIp();
    const { email } = await makeAccount(ip);
    for (let i = 0; i < 5; i++) {
      await login(req("/api/auth/login", { email, password: "wrong" }, ip));
    }
    const res = await login(
      req("/api/auth/login", { email, password: "wrong" }, ip),
    );
    expect(res.status).toBe(429);
  });
});
