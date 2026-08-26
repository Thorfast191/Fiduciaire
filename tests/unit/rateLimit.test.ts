import { describe, it, expect } from "vitest";
import {
  isLoginRateLimited,
  recordLoginFailure,
} from "../../src/lib/auth/rateLimit";

describe("login rate limiting", () => {
  it("allows login attempts under the limit", async () => {
    const email = `rl-${Date.now()}@example.test`;
    for (let i = 0; i < 4; i++) {
      await recordLoginFailure(email, "10.0.0.1");
    }
    await expect(isLoginRateLimited(email, "10.0.0.1")).resolves.toBe(false);
  });

  it("blocks after 5 failures within the window for the same email+ip", async () => {
    const email = `rl-block-${Date.now()}@example.test`;
    for (let i = 0; i < 5; i++) {
      await recordLoginFailure(email, "10.0.0.2");
    }
    await expect(isLoginRateLimited(email, "10.0.0.2")).resolves.toBe(true);
  });

  it("does not block a different ip for the same email", async () => {
    const email = `rl-diffip-${Date.now()}@example.test`;
    for (let i = 0; i < 5; i++) {
      await recordLoginFailure(email, "10.0.0.3");
    }
    await expect(isLoginRateLimited(email, "10.0.0.9")).resolves.toBe(false);
  });
});
