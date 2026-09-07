import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/components/LocaleSwitch";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiduvia.ch";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const t = getMessages(lang);
  const path = lang === "fr" ? "/faq" : `/${lang}/faq`;

  return {
    title: t.faq.title,
    description: t.faq.items[0]?.a,
    alternates: { canonical: `${SITE}${path}` },
  };
}

/**
 * Every question, reached from the home page's "Afficher toutes les questions"
 * button — the mockup's `openFaqAll` view (Fiduvia.dc.html:548), which shows the
 * full list where the home page shows only the first four.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = getMessages(lang);
  const home = localeHref(lang);

  return (
    <main
      lang={lang}
      className="min-h-screen bg-[var(--surface-page)] text-[var(--text-body)]"
    >
      <section className="mx-auto max-w-[780px] px-[34px] py-[64px] max-[700px]:px-5">
        <div className="text-center">
          <span className="fx-eyebrow text-[var(--text-muted)]">
            {t.faq.eyebrow}
          </span>

          <h2
            className="disp text-[clamp(28px,3.4vw,36px)] font-extrabold leading-[1.05]"
            style={{ marginTop: "6px" }}
          >
            {t.faq.title}
          </h2>
        </div>

        <div className="mt-[28px] flex flex-col">
          {t.faq.items.map((faq) => (
            <details
              key={faq.q}
              className="group border-t border-[var(--border-subtle)] py-[18px]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-[16px]">
                <h3 className="disp m-0 text-[19px] font-bold">{faq.q}</h3>

                <span className="shrink-0 text-[22px] font-bold text-[var(--brand)]">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>

              <p
                className="max-w-[640px] whitespace-pre-line text-[14.5px] leading-[1.6] text-[var(--text-muted)]"
                style={{ marginTop: "10px" }}
              >
                {faq.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-[30px] flex justify-center">
          <Link href={home} className="fx-btn-ghost">
            <span className="text-[17px]">←</span> {t.common.errHome}
          </Link>
        </div>
      </section>
    </main>
  );
}
