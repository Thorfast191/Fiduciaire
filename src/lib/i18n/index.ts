import { cookies } from "next/headers";
import { fr, type Messages } from "./messages/fr";
import { en } from "./messages/en";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

export type { Locale, Messages };
export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
} from "./config";

const BUNDLES: Record<Locale, Messages> = { fr, en };

export function getMessages(locale: Locale): Messages {
  return BUNDLES[locale];
}

/**
 * The locale for routes that carry no `[lang]` segment — everything behind
 * authentication. Public marketing routes read their locale from the URL
 * instead and pass it explicitly, so they stay statically renderable.
 *
 * `cookies()` marks the caller dynamic, which is correct here: `/portal` and
 * `/admin` already read the session cookie on every request.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Convenience for server components: resolve the locale and its bundle. */
export async function getT(): Promise<{ locale: Locale; t: Messages }> {
  const locale = await getLocale();
  return { locale, t: getMessages(locale) };
}
