import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST as publicContact } from "../../../src/app/api/contact/public/route";

/**
 * A fresh IP per run, for the same reason as `login.test.ts`: the limiter
 * counts `public_contact_sent` rows per IP over a rolling hour and `audit_log`
 * only grows, so fixed IPs would make unrelated assertions fail after a few
 * suite runs.
 */
let ipCounter = 0;
const ipRun = Math.floor(Math.random() * 250) + 1;
function uniqueIp(): string {
  ipCounter += 1;
  return `30.${ipRun}.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

function req(body: unknown, ip: string) {
  return new NextRequest("http://localhost/api/contact/public", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

const valid = {
  lastName: "Rochat",
  firstName: "Camille",
  email: "camille@exemple.ch",
  phone: "+41 79 000 00 00",
  message: "Bonjour, je souhaite un devis.",
};

describe("POST /api/contact/public", () => {
  it("accepts a complete message from an anonymous visitor", async () => {
    const res = await publicContact(req(valid, uniqueIp()));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("treats the phone number as optional", async () => {
    const withoutPhone = { ...valid, phone: undefined };
    const res = await publicContact(req(withoutPhone, uniqueIp()));
    expect(res.status).toBe(200);
  });

  it("rejects a missing message and a malformed address", async () => {
    const ip = uniqueIp();

    const noMessage = await publicContact(
      req({ ...valid, message: "   " }, ip),
    );
    expect(noMessage.status).toBe(400);

    const badEmail = await publicContact(
      req({ ...valid, email: "not-an-address" }, ip),
    );
    expect(badEmail.status).toBe(400);
  });

  it("caps submissions from one IP, and does not count the rejected ones", async () => {
    const ip = uniqueIp();

    for (let i = 0; i < 5; i += 1) {
      const res = await publicContact(req(valid, ip));
      expect(res.status).toBe(200);
    }

    const blocked = await publicContact(req(valid, ip));
    expect(blocked.status).toBe(429);

    // A different visitor is unaffected.
    const other = await publicContact(req(valid, uniqueIp()));
    expect(other.status).toBe(200);
  });
});
