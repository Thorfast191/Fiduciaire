import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyStripeWebhook } from "@/lib/stripe";

const SECRET = "whsec_test_secret";

function sign(body: string, secret = SECRET, timestamp = Math.floor(Date.now() / 1000)) {
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

describe("verifyStripeWebhook", () => {
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

  it("accepts a correctly signed, fresh payload", () => {
    const event = verifyStripeWebhook(body, sign(body), SECRET);
    expect(event?.id).toBe("evt_1");
    expect(event?.type).toBe("checkout.session.completed");
  });

  it("rejects a tampered body", () => {
    const header = sign(body);
    const tampered = body.replace("evt_1", "evt_hacked");
    expect(verifyStripeWebhook(tampered, header, SECRET)).toBeNull();
  });

  it("rejects a signature made with the wrong secret", () => {
    expect(verifyStripeWebhook(body, sign(body, "whsec_wrong"), SECRET)).toBeNull();
  });

  it("rejects a timestamp outside the tolerance window (replay)", () => {
    const old = Math.floor(Date.now() / 1000) - 10 * 60;
    expect(verifyStripeWebhook(body, sign(body, SECRET, old), SECRET)).toBeNull();
  });

  it("returns null when the header or secret is missing", () => {
    expect(verifyStripeWebhook(body, null, SECRET)).toBeNull();
    expect(verifyStripeWebhook(body, sign(body), "")).toBeNull();
  });
});
