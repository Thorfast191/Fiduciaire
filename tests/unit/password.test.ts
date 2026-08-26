import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password";

describe("password hashing", () => {
  it("hashes a password to a non-plaintext string", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse battery staple");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("s3cret!");
    await expect(verifyPassword(hash, "s3cret!")).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret!");
    await expect(verifyPassword(hash, "wrong")).resolves.toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});
