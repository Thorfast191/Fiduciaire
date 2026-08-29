import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const REQUIRED = {
  DATABASE_URL: "postgres://fiduvia:fiduvia@localhost:5432/fiduvia",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_FROM: "Fiduvia <no-reply@fiduvia.ch>",
  STORAGE_ENDPOINT: "http://localhost:9000",
  STORAGE_BUCKET: "fiduvia-documents",
  STORAGE_ACCESS_KEY_ID: "fiduvia",
  STORAGE_SECRET_ACCESS_KEY: "fiduvia123",
  STORAGE_REGION: "us-east-1",
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
    expect(env.STORAGE_BUCKET).toBe(REQUIRED.STORAGE_BUCKET);
  });

  it("throws when a required variable is missing", async () => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
    await expect(import("../../src/lib/env")).rejects.toThrow();
  });

  it("throws when a storage variable is missing", async () => {
    vi.resetModules();
    delete process.env.STORAGE_BUCKET;
    await expect(import("../../src/lib/env")).rejects.toThrow();
  });
});
