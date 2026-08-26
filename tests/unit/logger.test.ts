import { describe, it, expect } from "vitest";
import { logger } from "../../src/lib/logger";

describe("logger", () => {
  it("exposes standard pino log methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
  });

  it("does not throw when logging an object", () => {
    expect(() => logger.info({ route: "/test" }, "test message")).not.toThrow();
  });
});
