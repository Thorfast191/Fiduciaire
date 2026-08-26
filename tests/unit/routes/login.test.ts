import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as signup } from "../../../src/app/api/auth/signup/route";
import { POST as login } from "../../../src/app/api/auth/login/route";

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
    const { email, password } = await makeAccount("20.0.0.1");
    const res = await login(req("/api/auth/login", { email, password }, "20.0.0.1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rejects an incorrect password with a generic message", async () => {
    const { email } = await makeAccount("20.0.0.2");
    const res = await login(
      req("/api/auth/login", { email, password: "wrong-password" }, "20.0.0.2"),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).not.toMatch(/password/i);
  });

  it("rejects an unknown email with the same generic message as a wrong password", async () => {
    const unknown = await login(
      req(
        "/api/auth/login",
        { email: "nobody@example.test", password: "whatever123" },
        "20.0.0.3",
      ),
    );
    const wrongPw = await (async () => {
      const { email } = await makeAccount("20.0.0.3");
      return login(req("/api/auth/login", { email, password: "wrong" }, "20.0.0.3"));
    })();
    expect((await unknown.json()).error).toBe((await wrongPw.json()).error);
  });

  it("rate-limits after 5 failed attempts from the same email+ip", async () => {
    const { email } = await makeAccount("20.0.0.4");
    for (let i = 0; i < 5; i++) {
      await login(req("/api/auth/login", { email, password: "wrong" }, "20.0.0.4"));
    }
    const res = await login(
      req("/api/auth/login", { email, password: "wrong" }, "20.0.0.4"),
    );
    expect(res.status).toBe(429);
  });
});
