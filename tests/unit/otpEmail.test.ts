import { describe, it, expect } from "vitest";
import { otpEmailTemplate } from "../../src/lib/email/templates/otpEmail";

describe("otpEmailTemplate", () => {
  it("includes the code in both html and text bodies", () => {
    const result = otpEmailTemplate({ code: "123456", purpose: "login" });
    expect(result.html).toContain("123456");
    expect(result.text).toContain("123456");
    expect(result.subject.length).toBeGreaterThan(0);
  });

  it("uses different subject copy for password_reset", () => {
    const login = otpEmailTemplate({ code: "111111", purpose: "login" });
    const reset = otpEmailTemplate({
      code: "111111",
      purpose: "password_reset",
    });
    expect(login.subject).not.toBe(reset.subject);
  });
});
