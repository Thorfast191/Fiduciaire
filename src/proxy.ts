import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  PUBLIC_PATHS,
  type Locale,
} from "@/lib/i18n/config";

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
  ]
    .join("; ")
    .concat(";");
}

// The marketing page lives at /[lang], but French — the SEO target — is served
// at "/" with no prefix so there is exactly one canonical URL for it. English
// keeps its own indexable URL at /en. Locale is never inferred from
// Accept-Language: a crawler must always be shown the French page at "/".
function isPublicPath(pathname: string): boolean {
  return (PUBLIC_PATHS as readonly string[]).includes(pathname);
}

/**
 * Marks a request that this proxy has already rewritten onto a /fr route.
 *
 * A production build re-runs middleware on the internally rewritten path, so
 * "/" -> rewrite "/fr" would immediately match the "/fr" -> "/" redirect below
 * and bounce forever; the browser sees a 307 to the URL it just asked for.
 * `next dev` does not re-enter, which is why this only appears once built.
 *
 * The rewrite forwards this header on the internal request, so the second pass
 * can tell "someone typed /fr" from "we rewrote / onto /fr" and skip the
 * redirect in the latter case.
 */
const REWRITE_MARKER = "x-locale-rewritten";

function localeRoute(
  pathname: string,
): { locale: Locale; rewriteTo?: string; redirectTo?: string } | null {
  // French is served without a prefix, so "/" and "/confidentialite" are
  // rewritten onto the /fr routes rather than redirected — one canonical URL
  // each, and the prerendered page is what gets served.
  if (pathname === "/") return { locale: DEFAULT_LOCALE, rewriteTo: "/fr" };
  if (isPublicPath(pathname)) {
    return { locale: DEFAULT_LOCALE, rewriteTo: `/fr${pathname}` };
  }

  // /fr/... is the internal form; surface it prefix-free so it is not a
  // duplicate of the canonical URL.
  if (pathname === "/fr") return { locale: "fr", redirectTo: "/" };
  if (pathname.startsWith("/fr/") && isPublicPath(pathname.slice(3))) {
    return { locale: "fr", redirectTo: pathname.slice(3) };
  }

  if (pathname === "/en") return { locale: "en" };
  if (pathname.startsWith("/en/") && isPublicPath(pathname.slice(3))) {
    return { locale: "en" };
  }

  return null;
}

/**
 * A redirect to a path on the public origin.
 *
 * Middleware requires an absolute Location, and building one from `request.url`
 * bakes in whatever origin Next resolved — behind a reverse proxy that is the
 * internal listener, so visitors were sent to http://localhost:3001/... and got
 * nowhere. NEXT_PUBLIC_SITE_URL is the address the deployment is actually
 * reached on, which makes this independent of proxy headers, ports and scheme.
 * Falls back to the request's own origin when it is unset, as in development.
 */
function redirectTo(pathname: string, request: NextRequest): NextResponse {
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.url;
  return NextResponse.redirect(new URL(pathname, base));
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = buildCspHeader(nonce, isDev);
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const alreadyRewritten = request.headers.get(REWRITE_MARKER) === "1";

  if (isProtectedPath(pathname) && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const response = redirectTo("/login", request);
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  const route = localeRoute(pathname);

  if (route?.redirectTo && !alreadyRewritten) {
    const response = redirectTo(route.redirectTo, request);
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  if (route?.rewriteTo) requestHeaders.set(REWRITE_MARKER, "1");

  let rewriteTarget: URL | undefined;
  if (route?.rewriteTo) {
    rewriteTarget = request.nextUrl.clone();
    rewriteTarget.pathname = route.rewriteTo;
  }

  const response = rewriteTarget
    ? NextResponse.rewrite(rewriteTarget, {
        request: { headers: requestHeaders },
      })
    : NextResponse.next({ request: { headers: requestHeaders } });

  // Landing on a public locale URL settles the language for the signed-in app
  // too, so a visitor who reads /en and then logs in stays in English.
  if (route && request.cookies.get(LOCALE_COOKIE)?.value !== route.locale) {
    response.cookies.set(LOCALE_COOKIE, route.locale, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

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
