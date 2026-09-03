import Link from "next/link";
import { LOCALES, type Locale } from "@/lib/i18n/config";

/** French is served prefix-free at "/" so it has a single canonical URL. */
export function localeHref(locale: Locale): string {
  return locale === "fr" ? "/" : `/${locale}`;
}

/**
 * FR / EN toggle for the public marketing page.
 *
 * Plain links rather than buttons: each locale is a real, indexable URL, so the
 * switch works without JavaScript and crawlers can follow it. The proxy mirrors
 * the chosen locale into the `locale` cookie, which is what the signed-in app
 * reads.
 */
export function LocaleSwitch({ current }: { current: Locale }) {
  return (
    <div className="hidden items-center gap-[4px] rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[3px] sm:flex">
      {LOCALES.map((locale) => {
        const active = locale === current;

        return (
          <Link
            key={locale}
            href={localeHref(locale)}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            className={
              active
                ? "rounded-[7px] bg-[var(--teal-100)] px-[10px] py-[5px] text-[13px] font-bold text-[var(--brand)] no-underline"
                : "rounded-[7px] bg-transparent px-[10px] py-[5px] text-[13px] font-medium text-[var(--text-subtle)] no-underline transition-colors hover:text-[var(--text-body)]"
            }
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
