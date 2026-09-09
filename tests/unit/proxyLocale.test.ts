import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../../src/proxy";

const MARKER = "x-locale-rewritten";

function get(path: string, headers: Record<string, string> = {}) {
  return proxy(new NextRequest(`http://localhost:3000${path}`, { headers }));
}

/**
 * These cover a production-only failure: a built Next server re-runs middleware
 * on an internally rewritten path, so "/" -> rewrite "/fr" hit the "/fr" -> "/"
 * redirect on the second pass and the browser bounced between the two forever.
 * The whole French site — the default, canonical locale — was unreachable, and
 * `next dev` does not re-enter, so nothing caught it until the app was built.
 */
describe("proxy locale routing", () => {
  it("rewrites / onto /fr rather than redirecting", () => {
    const res = get("/");
    expect(res.status).not.toBe(307);
    expect(res.headers.get("x-middleware-rewrite")).toContain("/fr");
  });

  it("forwards the marker on the rewritten request, which is what breaks the loop", () => {
    const res = get("/");
    // Next carries headers set for the destination as x-middleware-request-*,
    // and lists them in x-middleware-override-headers.
    expect(res.headers.get(`x-middleware-request-${MARKER}`)).toBe("1");
    expect(res.headers.get("x-middleware-override-headers")).toContain(MARKER);
  });

  it("does not redirect /fr when the request is our own rewrite", () => {
    const res = get("/fr", { [MARKER]: "1" });
    expect(res.status).not.toBe(307);
  });

  it("still redirects /fr to / for a request that really asked for it", () => {
    const res = get("/fr");
    expect(res.status).toBe(307);
    // Absolute, on the public origin (NEXT_PUBLIC_SITE_URL when set).
    expect(res.headers.get("location")).toMatch(/\/$/);
  });

  it("rewrites every prefix-free public path, and does not loop on any", () => {
    for (const path of ["/faq", "/confidentialite", "/mentions-legales", "/cgvu", "/cookies"]) {
      const first = get(path);
      expect(first.status, `${path} should rewrite, not redirect`).not.toBe(307);
      expect(first.headers.get("x-middleware-rewrite")).toContain(`/fr${path}`);

      const second = get(`/fr${path}`, { [MARKER]: "1" });
      expect(second.status, `/fr${path} should not bounce back`).not.toBe(307);
    }
  });

  it("leaves /en alone, prefix and all", () => {
    expect(get("/en").status).not.toBe(307);
    expect(get("/en/faq").status).not.toBe(307);
  });

  it("sends an anonymous visitor on a protected path to /login", () => {
    const res = get("/portal");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toMatch(/\/login$/);
  });
});
