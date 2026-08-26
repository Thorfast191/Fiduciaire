import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const REQUIRED = {
  DATABASE_URL: "postgres://fiduvia:fiduvia@localhost:5432/fiduvia",
  SESSION_SECRET: "a".repeat(32),
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_FROM: "Fiduvia <no-reply@fiduvia.ch>",
};

describe("env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, REQUIRED);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("parses valid environment variables", async () => {
    vi.resetModules();
    const { env } = await import("../../src/lib/env");
    expect(env.DATABASE_URL).toBe(REQUIRED.DATABASE_URL);
    expect(env.SMTP_PORT).toBe(1025);
  });

  it("throws when a required variable is missing", async () => {
    vi.resetModules();
    delete process.env.SESSION_SECRET;
    await expect(import("../../src/lib/env")).rejects.toThrow();
  });
});
