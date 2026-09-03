import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitch, localeHref } from "@/components/LocaleSwitch";
import { StructuredData } from "@/components/StructuredData";
import { MobileMenu } from "@/components/MobileMenu";
import { PriceSimulator } from "@/components/PriceSimulator";
import { getMessages } from "@/lib/i18n";
import { LOCALES, isLocale } from "@/lib/i18n/config";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiduvia.ch";

/** Both locales are prerendered; "/" is a proxy rewrite onto /fr. */
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
  const path = lang === "fr" ? "/" : "/en";

  return {
    title: `Fiduvia — ${t.hero.title}`,
    description: t.hero.p1,
    alternates: {
      canonical: `${SITE}${path}`,
      languages: {
        "fr-CH": `${SITE}/`,
        en: `${SITE}/en`,
        "x-default": `${SITE}/`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Fiduvia",
      locale: lang === "fr" ? "fr_CH" : "en",
      url: `${SITE}${path}`,
      title: `Fiduvia — ${t.hero.title}`,
      description: t.hero.p1,
    },
  };
}

function Arrow() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = getMessages(lang);

  return (
    <main
      lang={lang}
      className="min-h-screen bg-[var(--surface-page)] text-[var(--text-body)]"
    >
      <StructuredData locale={lang} t={t} />
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header
        className="sticky top-0 z-40 border-b border-[var(--border-subtle)]"
        style={{
          background: "rgba(250, 247, 240, 0.9)",
          backdropFilter: "saturate(180%) blur(8px)",
          WebkitBackdropFilter: "saturate(180%) blur(8px)",
        }}
      >
        <nav
          className="mx-auto flex items-center gap-[26px] px-6 py-[15px] sm:px-8 lg:px-[56px]"
          style={{ maxWidth: "1380px" }}
        >
          {/* LOGO */}
          <Link
            href="/"
            className="mr-auto flex items-center gap-[11px] no-underline"
          >
            <span className="flex items-center gap-[16px] leading-none">
              <span className="h-[34px] w-[3px] shrink-0 rounded-[1px] bg-[var(--gold)]" />

              <span
                className="whitespace-nowrap text-[30px] font-medium tracking-[0.1em] text-[var(--text-strong)]"
                style={{
                  fontFamily: "var(--font-mark)",
                }}
              >
                F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
              </span>
            </span>
          </Link>

          {/* NAVIGATION */}
          <Link
            href="#about"
            className="hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            {t.nav.about}
          </Link>

          <Link
            href="#services"
            className="hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            {t.nav.services}
          </Link>

          <Link
            href="#steps"
            className="hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            {t.nav.method}
          </Link>

          <Link
            href="#tarifs"
            className="hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            {t.nav.pricing}
          </Link>

          <Link
            href="#faq"
            className="hidden whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors duration-150 hover:text-[var(--brand)] md:block"
          >
            FAQ
          </Link>

          {/* LANGUAGE */}
          <LocaleSwitch current={lang} />

          {/* LOGIN */}
          <Link
            href="/login"
            className="flex shrink-0 items-center whitespace-nowrap rounded-[9px] bg-[var(--brand)] px-[18px] py-[10px] text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-[var(--brand-hover)]"
          >
            <span className="hidden sm:inline">{t.nav.login}</span>
            <span className="sm:hidden">{t.nav.loginShort}</span>
          </Link>

          {/* MOBILE BURGER */}
          <MobileMenu t={t} />
        </nav>
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section
        id="home"
        className="relative min-h-[675px] overflow-hidden bg-[var(--surface-page)]"
      >
        {/* BACKGROUND */}
        <div className="absolute inset-0">
          <Image
            src="/hero-alpes.jpg"
            alt="Paysage des Alpes suisses"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* LEFT CREAM OVERLAY */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #FAF7F0 0%, rgba(250,247,240,.99) 25%, rgba(250,247,240,.93) 39%, rgba(250,247,240,.70) 52%, rgba(250,247,240,.30) 70%, rgba(250,247,240,.06) 100%)",
            }}
          />

          {/* TOP / BOTTOM OVERLAY */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(250,247,240,.72) 0%, rgba(250,247,240,.08) 24%, rgba(250,247,240,.02) 65%, rgba(250,247,240,.60) 100%)",
            }}
          />
        </div>

        {/* HERO CONTENT */}
        <div className="relative z-10 mx-auto flex min-h-[675px] w-full max-w-[1380px] items-center gap-[76px] px-6 pb-[62px] pt-[74px] sm:px-8 lg:px-[56px]">
          {/* LEFT COPY */}
          <div
            className="hero-copy"
            style={{
              flex: "1.45 1 0%",
              minWidth: "440px",
              paddingTop: "14px",
            }}
          >
            <span className="fx-eyebrow">{t.hero.eyebrow}</span>

            <h1
              className="disp"
              style={{
                fontWeight: 800,
                fontSize: "clamp(40px, 4.6vw, 58px)",
                lineHeight: 1.03,
                marginTop: "16px",
                maxWidth: "720px",
                letterSpacing: "-0.045em",
              }}
            >
              {t.hero.title}
            </h1>

            <div className="mt-5 flex max-w-[640px] flex-col gap-[13px]">
              <p
                className="m-0 text-[17px] leading-[1.55]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.hero.p1}
              </p>

              <p
                className="m-0 text-[17px] leading-[1.55]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.hero.p2}
              </p>

              <p
                className="m-0 text-[17px] leading-[1.55]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.hero.p3}
              </p>

              <div className="mt-[3px] flex items-start gap-[11px]">
                <span
                  className="w-[2px] shrink-0 self-stretch rounded-[1px]"
                  style={{ background: "rgb(196, 162, 101)" }}
                />

                <p
                  className="m-0 text-[15px] leading-[1.5]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t.hero.note}
                </p>
              </div>
            </div>

            <div className="mt-[30px] flex flex-wrap items-center gap-[18px]">
              <Link
                href="/login"
                className="inline-flex items-center gap-[9px] rounded-[12px] bg-[var(--brand)] px-[26px] py-[15px] text-[16px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
              >
                {t.hero.cta}
                <span className="text-[18px]">→</span>
              </Link>

              <span
                className="text-[14px]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.hero.already}{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[var(--brand)]"
                >
                  {t.nav.login}
                </Link>
              </span>
            </div>
          </div>

          {/* PRICE SIMULATOR */}
          <div
            id="pricing"
            className="relative z-10 w-full max-w-[395px] shrink-0 rounded-[18px] border border-[var(--border-subtle)] bg-white p-6 shadow-[0_18px_50px_rgba(15,42,63,.12)]"
          >
            <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-5">
              <div>
                <p className="fx-eyebrow text-[10px]">{t.sim.eyebrow}</p>

                <h2 className="mt-2 text-[23px] font-bold tracking-[-0.03em] text-[var(--petrol-900)]">
                  {t.sim.title}
                </h2>
              </div>

              <span className="font-[var(--font-mono)] text-[9px] uppercase tracking-[0.1em] text-[var(--text-subtle)]">
                {t.sim.noCommitment}
              </span>
            </div>

            <PriceSimulator t={t} />
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST BAR
      ========================================================= */}
      <section className="bg-[var(--teal-600)]">
        <div
          className="mx-auto flex flex-wrap items-center justify-center gap-x-[44px] gap-y-4 px-[34px] py-[22px]"
          style={{ maxWidth: "1120px" }}
        >
          <span className="flex items-center gap-[10px] text-[14px] font-semibold text-white">
            <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--teal-300)] opacity-75" />
            {t.trust.clients}
          </span>

          <span className="flex items-center gap-[10px] text-[14px] font-semibold text-white">
            <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--teal-300)] opacity-75" />
            {t.trust.hosting}
          </span>

          <span className="flex items-center gap-[10px] text-[14px] font-semibold text-white">
            <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--teal-300)] opacity-75" />
            {t.trust.experts}
          </span>
        </div>
      </section>

      {/* =========================================================
          ABOUT
      ========================================================= */}
      <section
        id="about"
        className="mx-auto max-w-[1120px] px-[34px] py-[56px]"
      >
        <span className="fx-eyebrow block text-center text-[var(--text-muted)]">
          {t.about.eyebrow}
        </span>

        <h2
          className="
            disp
            mt-[6px]
            w-full
            text-center
            text-[clamp(30px,4.4vw,50px)]
            font-extrabold
            leading-[1.05]
          "
        >
          {t.about.title}
        </h2>

        {/* STATS */}
        <div className="mt-[34px] grid w-full grid-cols-1 gap-[32px] sm:grid-cols-3">
          <div className="flex flex-col items-center gap-[3px] text-center">
            <span className="disp fx-figure text-[34px] font-extrabold leading-none text-[var(--brand)]">
              {t.about.stats[0].value}
            </span>

            <span className="text-[13px] text-[var(--text-muted)]">
              {t.about.stats[0].label}
            </span>
          </div>

          <div className="flex flex-col items-center gap-[3px] text-center">
            <span className="disp fx-figure text-[34px] font-extrabold leading-none text-[var(--brand)]">
              {t.about.stats[1].value}
            </span>

            <span className="text-[13px] text-[var(--text-muted)]">
              {t.about.stats[1].label}
            </span>
          </div>

          <div className="flex flex-col items-center gap-[3px] text-center">
            <span className="disp fx-figure text-[34px] font-extrabold leading-none text-[var(--brand)]">
              {t.about.stats[2].value}
            </span>

            <span className="text-[13px] text-[var(--text-muted)]">
              {t.about.stats[2].label}
            </span>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="mt-[34px] w-full">
          <p className="text-[15.5px] leading-[1.7] text-[var(--text-muted)]">
            {t.about.p1}
          </p>

          <p className="mt-[14px] text-[15.5px] leading-[1.7] text-[var(--text-muted)]">
            {t.about.p2}
          </p>

          <p className="mt-[14px] text-[15.5px] leading-[1.7] text-[var(--text-muted)]">
            {t.about.p3}
          </p>
        </div>

        {/* FEATURE CARDS */}
        <div className="mt-[40px] grid grid-cols-1 gap-[16px] sm:grid-cols-2">
          {/* CARD 1 */}
          <div className="flex flex-col gap-[12px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[22px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
                <path d="M16 3.6a4 4 0 0 1 0 7.8" />
                <path d="M21.5 21a6.5 6.5 0 0 0-5-6.3" />
              </svg>
            </div>

            <div>
              <h3 className="disp text-[17px] font-bold">
                {t.about.values[0].title}
              </h3>

              <p className="mt-[5px] text-[13.5px] leading-[1.55] text-[var(--text-muted)]">
                {t.about.values[0].desc}
              </p>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="flex flex-col gap-[12px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[22px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>

            <div>
              <h3 className="disp text-[17px] font-bold">
                {t.about.values[1].title}
              </h3>

              <p className="mt-[5px] text-[13.5px] leading-[1.55] text-[var(--text-muted)]">
                {t.about.values[1].desc}
              </p>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="flex flex-col gap-[12px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[22px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <div>
              <h3 className="disp text-[17px] font-bold">
                {t.about.values[2].title}
              </h3>

              <p className="mt-[5px] text-[13.5px] leading-[1.55] text-[var(--text-muted)]">
                {t.about.values[2].desc}
              </p>
            </div>
          </div>

          {/* CARD 4 */}
          <div className="flex flex-col gap-[12px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[22px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>

            <div>
              <h3 className="disp text-[17px] font-bold">
                {t.about.values[3].title}
              </h3>

              <p className="mt-[5px] text-[13.5px] leading-[1.55] text-[var(--text-muted)]">
                {t.about.values[3].desc}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-[16px] text-[12.5px] leading-[1.6] text-[var(--text-muted)] opacity-[0.85]">
          {t.about.footnote}
        </p>
      </section>

      {/* =========================================================
          SERVICES — CLIENT VERSION
      ========================================================= */}
      <section
        id="services"
        className="mx-auto max-w-[1120px] px-[34px] pb-[56px] pt-[64px] max-[700px]:px-5"
      >
        {/* SECTION TITLE */}
        <div className="text-center">
          <span className="fx-eyebrow text-[var(--text-muted)]">
            {t.services.eyebrow}
          </span>

          <h2 className="disp mt-[6px] text-[clamp(28px,3.4vw,36px)] font-extrabold leading-[1.05]">
            {t.services.title}
          </h2>
        </div>

        {/* SIX SERVICES */}
        <div className="mt-[36px] grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
          {/* 01 */}
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[24px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
            </div>

            <h3 className="disp mt-[4px] text-[19px] font-bold">
              {t.services.items[0].title}
            </h3>

            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-muted)]">
              {t.services.items[0].desc}
            </p>
          </div>

          {/* 02 */}
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[24px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22l-4-9-9-4 20-7z" />
              </svg>
            </div>

            <h3 className="disp mt-[4px] text-[19px] font-bold">
              {t.services.items[1].title}
            </h3>

            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-muted)]">
              {t.services.items[1].desc}
            </p>
          </div>

          {/* 03 */}
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[24px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>

            <h3 className="disp mt-[4px] text-[19px] font-bold">
              {t.services.items[2].title}
            </h3>

            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-muted)]">
              {t.services.items[2].desc}
            </p>
          </div>

          {/* 04 */}
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[24px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>

            <h3 className="disp mt-[4px] text-[19px] font-bold">
              {t.services.items[3].title}
            </h3>

            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-muted)]">
              {t.services.items[3].desc}
            </p>
          </div>

          {/* 05 */}
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[24px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>

            <h3 className="disp mt-[4px] text-[19px] font-bold">
              {t.services.items[4].title}
            </h3>

            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-muted)]">
              {t.services.items[4].desc}
            </p>
          </div>

          {/* 06 */}
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[24px] shadow-[var(--shadow-xs)]">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--teal-100)] text-[var(--brand)]">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            <h3 className="disp mt-[4px] text-[19px] font-bold">
              {t.services.items[5].title}
            </h3>

            <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-muted)]">
              {t.services.items[5].desc}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          METHOD
      ========================================================= */}
      <section
        id="steps"
        className="bg-[var(--petrol-900)] py-28 text-white sm:py-32"
      >
        <div className="mx-auto w-full max-w-[1380px] px-6 sm:px-8 lg:px-14">
          <div className="grid gap-16 lg:grid-cols-[.8fr_1.2fr] lg:gap-28">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-300)]">
                {t.steps.eyebrow}
              </p>

              <h2 className="mt-5 max-w-[500px] text-[42px] font-bold leading-[1] tracking-[-0.045em] text-white sm:text-[55px]">
                {t.steps.titleLine1}
                <br />
                <span className="text-[var(--teal-300)]">
                  {t.steps.titleLine2}
                </span>
              </h2>

              <p className="mt-7 max-w-[430px] text-[14px] leading-7 text-white/55">
                {t.steps.sub}
              </p>
            </div>

            <div>
              {t.steps.items.map((step) => (
                <div
                  key={step.number}
                  className="grid gap-5 border-t border-white/15 py-8 sm:grid-cols-[70px_1fr]"
                >
                  <span className="fx-figure text-[11px] text-[var(--teal-300)]">
                    {step.number}
                  </span>

                  <div>
                    <h3 className="text-[22px] font-bold text-white">
                      {step.title}
                    </h3>

                    <p className="mt-3 max-w-[560px] text-[13px] leading-6 text-white/50">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t border-white/15" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}
      <section id="tarifs" className="bg-[var(--surface-page)] py-28 sm:py-32">
        <div className="mx-auto w-full max-w-[1100px] px-6">
          <div className="text-center">
            <p className="fx-eyebrow">{t.nav.pricing}</p>

            <h2 className="mt-5 text-[42px] font-bold tracking-[-0.045em] sm:text-[54px]">
              {t.pricing.title}
            </h2>

            <p className="mx-auto mt-5 max-w-[600px] text-[15px] leading-7 text-[var(--text-muted)]">
              {t.pricing.sub}
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {/* PARTICULIER */}
            <div className="rounded-[18px] border border-[var(--border-subtle)] bg-white p-7">
              <p className="fx-eyebrow text-[10px]">
                {t.pricing.plans[0].name}
              </p>

              <p className="fx-figure mt-5 text-[32px] font-semibold text-[var(--petrol-900)]">
                CHF 250.–
              </p>

              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                {t.pricing.fromPerReturn}
              </p>

              <div className="my-7 h-px bg-[var(--border-subtle)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-800)]">
                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[0].features[0]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[0].features[1]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[0].features[2]}
                </li>
              </ul>
            </div>

            {/* INDEPENDANT */}
            <div className="relative rounded-[18px] border-2 border-[var(--brand)] bg-white p-7">
              <span className="absolute right-5 top-5 rounded-full bg-[var(--teal-100)] px-3 py-1 font-[var(--font-mono)] text-[9px] uppercase tracking-[0.08em] text-[var(--brand)]">
                {t.pricing.popular}
              </span>

              <p className="fx-eyebrow text-[10px]">
                {t.pricing.plans[1].name}
              </p>

              <p className="mt-5 text-[32px] font-bold tracking-[-0.03em] text-[var(--petrol-900)]">
                {t.pricing.custom}
              </p>

              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                {t.pricing.perActivity}
              </p>

              <div className="my-7 h-px bg-[var(--border-subtle)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-800)]">
                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[1].features[0]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[1].features[1]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[1].features[2]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[1].features[3]}
                </li>
              </ul>
            </div>

            {/* ENTREPRISE */}
            <div className="rounded-[18px] border border-[var(--border-subtle)] bg-white p-7">
              <p className="fx-eyebrow text-[10px]">
                {t.pricing.plans[2].name}
              </p>

              <p className="mt-5 text-[32px] font-bold tracking-[-0.03em] text-[var(--petrol-900)]">
                {t.pricing.custom}
              </p>

              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                {t.pricing.perNeeds}
              </p>

              <div className="my-7 h-px bg-[var(--border-subtle)]" />

              <ul className="space-y-3 text-[12px] text-[var(--petrol-800)]">
                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[2].features[0]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[2].features[2]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[2].features[1]}
                </li>

                <li className="flex items-center gap-2">
                  <Check />
                  {t.pricing.plans[2].features[3]}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section id="faq" className="bg-white py-28 sm:py-32">
        <div className="mx-auto w-full max-w-[900px] px-6">
          <div className="text-center">
            <p className="fx-eyebrow">FAQ</p>

            <h2 className="mt-5 text-[42px] font-bold tracking-[-0.045em] sm:text-[54px]">
              {t.faq.title}
            </h2>
          </div>

          <div className="mt-14 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {t.faq.items.map((faq) => (
              <details key={faq.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15px] font-semibold text-[var(--petrol-900)]">
                  {faq.q}

                  <span className="text-[var(--brand)] transition-transform group-open:rotate-45">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>

                <p className="mt-4 max-w-[700px] text-[13px] leading-6 text-[var(--text-muted)]">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT
      ========================================================= */}
      <section className="bg-[var(--surface-page)] px-6 py-28">
        <div className="mx-auto max-w-[900px] rounded-[28px] bg-[var(--petrol-900)] px-7 py-16 text-center sm:px-12 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-300)]">
            {t.cta.eyebrow}
          </p>

          <h2 className="mt-5 text-[42px] font-bold leading-[1] tracking-[-0.045em] text-white sm:text-[56px]">
            {t.cta.titleLine1}
            <br />
            {t.cta.titleLine2}
          </h2>

          <p className="mx-auto mt-6 max-w-[520px] text-[14px] leading-7 text-white/55">
            {t.cta.sub}
          </p>

          <a
            href="mailto:contact@fiduvia.ch"
            className="mt-8 inline-flex h-[50px] items-center justify-center gap-3 rounded-full bg-white px-7 text-[13px] font-semibold text-[var(--petrol-900)] transition hover:bg-[var(--surface-page)]"
          >
            {t.cta.button}
            <Arrow />
          </a>

          {/* The mockup's "Nous joindre" block, so the footer's Contact link
              and the mobile menu have a real destination on this page. */}
          <div
            id="contact"
            className="mx-auto mt-12 grid max-w-[760px] gap-4 border-t border-white/10 pt-10 text-left sm:grid-cols-3"
          >
            {[
              {
                label: t.portal.contactsEmail,
                value: "contact@fiduvia.ch",
                href: "mailto:contact@fiduvia.ch",
              },
              {
                label: t.portal.contactsPhone,
                value: "+41 21 000 00 00",
                href: "tel:+41210000000",
              },
              {
                label: t.portal.contactsAddress,
                value: "Rue de Bourg 12, 1003 Lausanne",
              },
            ].map((c) => (
              <div key={c.label}>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-white/45">
                  {c.label}
                </p>

                {c.href ? (
                  <a
                    href={c.href}
                    className="mt-1.5 block text-[15px] font-semibold text-white transition hover:text-white/70"
                  >
                    {c.value}
                  </a>
                ) : (
                  <p className="mt-1.5 text-[15px] font-semibold text-white">
                    {c.value}
                  </p>
                )}
              </div>
            ))}

            <p className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-white/45 sm:col-span-3">
              {t.portal.contactsHours} · {t.portal.contactsHoursDays} ·{" "}
              {t.portal.contactsHoursTime}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="bg-[var(--petrol-900)] text-white">
        <div className="mx-auto w-full max-w-[1380px] px-6 py-14 sm:px-8 lg:px-14">
          <div className="grid gap-12 md:grid-cols-[1.5fr_.7fr_.7fr]">
            {/* BRAND */}
            <div>
              <Link
                href="/"
                className="font-[var(--font-mark)] text-[30px] font-medium tracking-[-0.04em]"
              >
                fiduvia
              </Link>

              <p className="mt-5 max-w-[350px] text-[13px] leading-6 text-white/45">
                {t.footer.tagline}
              </p>
            </div>

            {/* NAVIGATION */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                {t.footer.navigation}
              </p>

              <div className="mt-5 space-y-3 text-[12px] text-white/55">
                <a href="#about" className="block hover:text-white">
                  {t.about.eyebrow}
                </a>

                <a href="#services" className="block hover:text-white">
                  {t.nav.services}
                </a>

                <a href="#steps" className="block hover:text-white">
                  {t.nav.method}
                </a>

                <a href="#tarifs" className="block hover:text-white">
                  {t.nav.pricing}
                </a>
              </div>
            </div>

            {/* CONTACT */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
                {t.footer.contact}
              </p>

              <div className="mt-5 space-y-3 text-[12px] text-white/55">
                <a
                  href="mailto:contact@fiduvia.ch"
                  className="block hover:text-white"
                >
                  contact@fiduvia.ch
                </a>

                <Link href="/login" className="block hover:text-white">
                  {t.footer.clientArea}
                </Link>
              </div>
            </div>
          </div>

          {/* FOOTER BOTTOM */}
          <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-[10px] text-white/30 sm:flex-row">
            <p>
              © {new Date().getFullYear()} Fiduvia. {t.footer.rights}
            </p>

            <div className="flex gap-6">
              <Link
                href={`${localeHref(lang)}confidentialite`.replace("//", "/")}
                className="hover:text-white/60"
              >
                {t.footer.privacy}
              </Link>

              <Link
                href={`${localeHref(lang)}mentions-legales`.replace("//", "/")}
                className="hover:text-white/60"
              >
                {t.footer.legal}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
