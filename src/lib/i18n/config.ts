/**
 * Locale plumbing shared by the proxy (edge), server components and client
 * components. Kept free of `next/headers` and of the message bundles so the
 * proxy can import it without pulling either into the edge bundle.
 */
export const LOCALES = ["fr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** French is the default: the client is a Swiss fiduciary in Romandie. */
export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "locale";

/** One year — the choice is a preference, not a session detail. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Public marketing paths that live under the `[lang]` segment but are served
 * prefix-free in French, exactly like the home page. Anything not listed here
 * is an application route (login, portal, admin) and is never locale-prefixed.
 */
export const PUBLIC_PATHS = ["/confidentialite", "/mentions-legales"] as const;
