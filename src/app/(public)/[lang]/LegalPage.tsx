import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { Locale } from "@/lib/i18n/config";
import { localeHref } from "@/components/LocaleSwitch";

/**
 * Shared shell for the legal pages.
 *
 * The documents themselves are the client's to supply and have reviewed — this
 * deliberately states that rather than publishing drafted legal text, while
 * giving the footer links somewhere real to point and showing the controller's
 * contact details, which are factual.
 */
export function LegalPage({
  lang,
  t,
  title,
  intro,
}: {
  lang: Locale;
  t: Messages;
  title: string;
  intro: string;
}) {
  return (
    <main
      lang={lang}
      className="min-h-screen bg-[var(--surface-page)] px-6 py-16 text-[var(--text-body)]"
    >
      <div className="mx-auto w-full max-w-[720px]">
        <Link
          href={localeHref(lang)}
          className="text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
        >
          ← {t.legal.backHome}
        </Link>

        <h1 className="disp mt-5 text-[clamp(30px,4vw,40px)] font-extrabold leading-[1.05]">
          {title}
        </h1>

        <p className="mt-3 text-[16px] leading-[1.6] text-[var(--text-muted)]">
          {intro}
        </p>

        <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="disp text-[18px] font-bold">{t.legal.pendingTitle}</h2>

          <p className="mt-2 text-[14.5px] leading-[1.6] text-[var(--text-body)]">
            {t.legal.pendingBody}
          </p>
        </section>

        <section className="mt-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
            {t.legal.controllerTitle}
          </h2>

          <address className="mt-3 not-italic text-[14.5px] leading-[1.7] text-[var(--text-body)]">
            Fiduvia
            <br />
            Rue de Bourg 12, 1003 Lausanne,{" "}
            {lang === "fr" ? "Suisse" : "Switzerland"}
            <br />
            <a
              href="mailto:contact@fiduvia.ch"
              className="font-semibold text-[var(--brand)]"
            >
              contact@fiduvia.ch
            </a>
          </address>
        </section>
      </div>
    </main>
  );
}
