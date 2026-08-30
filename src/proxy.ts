import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const PROTECTED_PREFIXES = ["/portal", "/admin"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Per-request nonce-based CSP: Next.js's App Router emits inline
// <script>self.__next_f.push(...)</script> tags to stream RSC payloads to
// the client for hydration, so a static `script-src 'self'` (no
// 'unsafe-inline'/nonce) blocks them and the app never hydrates. Next.js
// parses the CSP response header for a `'nonce-{value}'` token and applies
// it automatically to its own framework/page scripts, so no per-page
// changes are needed beyond the header itself.
// See node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
// The client uploads/downloads files directly to/from object storage using
// presigned URLs (see DossierDetail's `fetch(uploadUrl, ...)`), so the
// storage endpoint's origin must be allowed under connect-src — otherwise
// `default-src 'self'` blocks that fetch and uploads fail silently in the
// browser (network calls to other origins are unaffected by CSP, which is
// why this only surfaces once something actually calls fetch()/XHR to it).
function storageOrigin(): string | null {
  try {
    return new URL(process.env.STORAGE_ENDPOINT ?? "").origin;
  } catch {
    return null;
  }
}

function buildCspHeader(nonce: string, isDev: boolean): string {
  const connectSrc = ["'self'", storageOrigin()].filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ").concat(";");
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = buildCspHeader(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  if (isProtectedPath(request.nextUrl.pathname) && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
