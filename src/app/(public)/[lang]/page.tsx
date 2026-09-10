import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitch, localeHref } from "@/components/LocaleSwitch";
import { StructuredData } from "@/components/StructuredData";
import { MobileMenu } from "@/components/MobileMenu";
import { PriceSimulator } from "@/components/PriceSimulator";
import { ContactForm } from "@/components/ContactForm";
import { LoginTrigger } from "@/components/auth/LoginTrigger";
import { getMessages } from "@/lib/i18n";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { localeAlternates, socialMeta } from "@/lib/seo";

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

  const title = `Fiduvia — ${t.hero.title}`;

  return {
    title,
    description: t.hero.p1,
    alternates: localeAlternates(lang, ""),
    ...socialMeta(lang, "", title, t.hero.p1),
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
          <LoginTrigger
            className="flex shrink-0 items-center whitespace-nowrap rounded-[9px] bg-[var(--brand)] px-[18px] py-[10px] text-[14px] font-semibold transition-colors duration-150 hover:bg-[var(--brand-hover)]"
            style={{ color: "#fff" }}
          >
            <span className="hidden sm:inline">{t.nav.login}</span>
            <span className="sm:hidden">{t.nav.loginShort}</span>
          </LoginTrigger>

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
                href="/signup"
                className="inline-flex items-center gap-[9px] rounded-[12px] bg-[var(--brand)] px-[26px] py-[15px] text-[16px] font-semibold transition hover:bg-[var(--brand-hover)]"
                style={{ color: "#fff" }}
              >
                {t.hero.cta}
                <span className="text-[18px]">→</span>
              </Link>

              <span
                className="text-[14px]"
                style={{ color: "var(--text-muted)" }}
              >
                {t.hero.already}{" "}
                <LoginTrigger
                  className="font-semibold"
                  style={{ color: "var(--brand)" }}
                >
                  {t.nav.login}
                </LoginTrigger>
              </span>
            </div>
          </div>

          {/* PRICE SIMULATOR */}
          <div
            id="pricing"
            className="relative z-10 w-full max-w-[395px] shrink-0 rounded-[18px] border border-[var(--border-subtle)] bg-white p-6 shadow-[0_18px_50px_rgba(15,42,63,.12)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <p className="fx-eyebrow text-[10px]">{t.sim.eyebrow}</p>

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
            w-full
            text-center
            text-[clamp(30px,4.4vw,50px)]
            font-extrabold
            leading-[1.05]
          "
          style={{ marginTop: "6px" }}
        >
          {t.about.title}
        </h2>

        {/* STATS */}
        <div className="mt-[34px] grid w-full grid-cols-1 gap-[32px] sm:grid-cols-3">
          <div className="flex flex-col items-center gap-[3px] text-center">
            <span
              className="disp fx-figure text-[34px] font-extrabold leading-none"
              style={{ color: "var(--brand)" }}
            >
              {t.about.stats[0].value}
            </span>

            <span className="text-[13px] text-[var(--text-muted)]">
              {t.about.stats[0].label}
            </span>
          </div>

          <div className="flex flex-col items-center gap-[3px] text-center">
            <span
              className="disp fx-figure text-[34px] font-extrabold leading-none"
              style={{ color: "var(--brand)" }}
            >
              {t.about.stats[1].value}
            </span>

            <span className="text-[13px] text-[var(--text-muted)]">
              {t.about.stats[1].label}
            </span>
          </div>

          <div className="flex flex-col items-center gap-[3px] text-center">
            <span
              className="disp fx-figure text-[34px] font-extrabold leading-none"
              style={{ color: "var(--brand)" }}
            >
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
      <div className="border-y border-[var(--border-subtle)] bg-[var(--surface-cream)]">
      <section
        id="services"
        className="mx-auto max-w-[1120px] px-[34px] pb-[56px] pt-[64px] max-[700px]:px-5"
      >
        {/* SECTION TITLE */}
        <div className="text-center">
          <span className="fx-eyebrow text-[var(--text-muted)]">
            {t.services.eyebrow}
          </span>

          <h2
            className="disp text-[clamp(28px,3.4vw,36px)] font-extrabold leading-[1.05]"
            style={{ marginTop: "6px" }}
          >
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
      </div>

      {/* =========================================================
          METHOD
      ========================================================= */}
      <section
        id="steps"
        className="mx-auto max-w-[1120px] px-[34px] py-[56px] max-[700px]:px-5"
      >
        <div className="text-center">
          <span className="fx-eyebrow text-[var(--text-muted)]">
            {t.steps.eyebrow}
          </span>

          <h2
            className="disp text-[clamp(28px,3.4vw,36px)] font-extrabold leading-[1.05]"
            style={{ marginTop: "6px" }}
          >
            {t.steps.title}
          </h2>
        </div>

        <div className="mt-[36px] flex flex-wrap gap-[20px]">
          {t.steps.items.map((step) => (
            <div
              key={step.number}
              className="flex min-w-[220px] flex-1 flex-col gap-[12px]"
            >
              <div
                className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[var(--petrol-800)] text-[20px] text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                }}
              >
                {step.number}
              </div>

              <h3 className="disp m-0 text-[21px] font-bold">{step.title}</h3>

              <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-muted)]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================= */}
      <div className="border-y border-[var(--border-subtle)] bg-[var(--surface-cream)]">
        <section
          id="tarifs"
          className="mx-auto max-w-[1120px] px-[34px] py-[64px] max-[700px]:px-5"
        >
          <div className="text-center">
            <span className="fx-eyebrow text-[var(--text-muted)]">
              {t.pricing.eyebrow}
            </span>

            <h2
              className="disp text-[clamp(28px,3.4vw,36px)] font-extrabold leading-[1.05]"
              style={{ marginTop: "6px" }}
            >
              {t.pricing.title}
            </h2>

            <p
              className="text-[15px] text-[var(--text-muted)]"
              style={{ marginTop: "8px" }}
            >
              {t.pricing.sub}
            </p>
          </div>

          {/* Three declaration tariff cards, matching the fiduvia.ch reference:
              single / couple / self-employed, each with its feature list. The
              detailed rate list (student, supplements, flat fees) is applied by
              the estimator and the questionnaire rather than shown here. */}
          <div className="mx-auto mt-[36px] grid max-w-[940px] grid-cols-1 items-stretch gap-[18px] sm:grid-cols-3">
            {t.pricing.cards.map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col gap-[14px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-[26px] py-[30px] shadow-[var(--shadow-sm)]"
              >
                <h3 className="disp m-0 text-[19px] font-bold">{plan.name}</h3>

                <div className="flex items-baseline gap-[7px]">
                  <span className="fx-eyebrow text-[var(--text-muted)]">
                    {t.pricing.from}
                  </span>
                  <span
                    className="disp fx-figure text-[34px] font-extrabold leading-none"
                    style={{ color: "var(--brand)" }}
                  >
                    {plan.price}
                  </span>
                </div>

                <ul className="m-0 flex list-none flex-col gap-[9px] p-0">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-[9px] text-[14px] leading-[1.4] text-[var(--text-body)]"
                    >
                      <span
                        aria-hidden
                        className="mt-[1px] font-bold"
                        style={{ color: "var(--brand)" }}
                      >
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="fx-btn-outline mt-auto">
                  {t.pricing.choose}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* =========================================================
          FAQ
      ========================================================= */}
      <section
        id="faq"
        className="mx-auto max-w-[780px] px-[34px] py-[64px] max-[700px]:px-5"
      >
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
          {t.faq.items.slice(0, 4).map((faq) => (
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
          <Link
            href={`${localeHref(lang)}faq`.replace("//", "/")}
            className="fx-btn-ghost"
          >
            {t.faq.allButton} <span className="text-[17px]">→</span>
          </Link>
        </div>
      </section>

      {/* =========================================================
          CONTACT
      ========================================================= */}
      <section
        id="contact"
        className="mx-auto mb-[64px] max-w-[1120px] px-[34px] max-[700px]:px-5"
      >
        <div className="flex flex-wrap items-start gap-[48px] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-[40px] shadow-[var(--shadow-md)] max-[700px]:p-6">
          <div className="flex min-w-[260px] max-w-[360px] flex-1 flex-col gap-[14px]">
            <h2 className="disp m-0 text-[clamp(26px,3vw,34px)] font-extrabold leading-[1.08]">
              {t.contact.title}
            </h2>

            <p className="m-0 text-[15px] leading-[1.6] text-[var(--text-muted)]">
              {t.contact.sub}
            </p>

            <div className="my-[6px] h-px bg-[var(--border-subtle)]" />

            <div className="flex flex-col gap-[4px]">
              <span className="fx-field-label m-0">{t.contact.emailField}</span>

              <a
                href="mailto:contact@fiduvia.ch"
                className="text-[15px] text-[var(--brand)]"
              >
                contact@fiduvia.ch
              </a>
            </div>

            <div className="flex flex-col gap-[4px]">
              <span className="fx-field-label m-0">{t.contact.hoursTitle}</span>

              <span className="text-[14px] leading-[1.5] text-[var(--text-muted)]">
                {t.contact.hoursDays}
                <br />
                {t.contact.hoursTime}
              </span>
            </div>
          </div>

          <ContactForm t={t} />
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="bg-[var(--petrol-900)]">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-start justify-between gap-[30px] px-[34px] py-[44px] max-[700px]:px-5">
          <div className="max-w-[280px]">
            <span className="flex items-center gap-[14px] leading-none">
              <span className="h-[30px] w-[2px] shrink-0 rounded-[1px] bg-[var(--gold)]" />

              <span
                className="whitespace-nowrap text-[26px] font-medium tracking-[0.1em] text-white"
                style={{ fontFamily: "var(--font-mark)" }}
              >
                F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
              </span>
            </span>

            <p className="mt-2 text-[13px] leading-[1.55] text-[var(--neutral-400)]">
              {t.footer.tagline}
            </p>

            <div className="mt-5 flex flex-col gap-[9px]">
              <span className="fx-onDark-label">{t.footer.socialTitle}</span>

              <div className="flex gap-[10px]">
                <a
                  href="https://www.instagram.com/fiduvia.ch/"
                  target="_blank"
                  rel="noopener"
                  aria-label="Instagram"
                  className="fx-social"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>

                <a
                  href="https://www.facebook.com/profile.php?id=61592110525594"
                  target="_blank"
                  rel="noopener"
                  aria-label="Facebook"
                  className="fx-social"
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 8.5h2.2V5.6h-2.4c-2.3 0-3.7 1.5-3.7 3.8v1.9H8.3v2.9h2.3V21h3v-6.8h2.3l.4-2.9h-2.7V9.7c0-.8.3-1.2.9-1.2Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-[44px]">
            <div className="flex max-w-[230px] flex-col gap-[8px]">
              <span className="fx-onDark-label">{t.footer.contactTitle}</span>

              <span className="text-[14px] leading-[1.5] text-[var(--text-on-dark)]">
                {t.footer.addressLine1}
              </span>

              <span className="text-[14px] leading-[1.5] text-[var(--text-on-dark)]">
                {t.footer.addressLine2}
              </span>

              <a href="mailto:contact@fiduvia.ch" className="fx-onDark-link">
                {t.footer.email}
              </a>

              <span className="mt-1.5 text-[12.5px] leading-[1.5] text-[var(--neutral-400)]">
                {t.footer.hours}
              </span>

              <span className="text-[12.5px] leading-[1.5] text-[var(--neutral-400)]">
                {t.footer.reply}
              </span>
            </div>

            <div className="flex flex-col gap-[11px]">
              <span className="fx-onDark-label">{t.footer.legalTitle}</span>

              <Link
                href={lang === "fr" ? "/confidentialite" : `/${lang}/confidentialite`}
                className="fx-onDark-link"
              >
                {t.footer.privacy}
              </Link>

              <Link
                href={lang === "fr" ? "/mentions-legales" : `/${lang}/mentions-legales`}
                className="fx-onDark-link"
              >
                {t.footer.legal}
              </Link>

              <Link
                href={lang === "fr" ? "/cgvu" : `/${lang}/cgvu`}
                className="fx-onDark-link"
              >
                {t.footer.terms}
              </Link>

              <Link
                href={lang === "fr" ? "/cookies" : `/${lang}/cookies`}
                className="fx-onDark-link"
              >
                {t.footer.cookies}
              </Link>

              <LoginTrigger className="fx-onDark-link">
                {t.footer.clientArea}
              </LoginTrigger>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border-ondark)]">
          <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-[12px] px-[34px] py-[16px] max-[700px]:px-5">
            <span className="fx-onDark-label tracking-[0.1em]">
              © {new Date().getFullYear()} Fiduvia · {t.footer.rights}
            </span>

            <span className="fx-onDark-label tracking-[0.1em]">
              {t.footer.hosted}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
