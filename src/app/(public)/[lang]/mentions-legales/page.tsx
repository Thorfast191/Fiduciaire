import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { LegalPage } from "../LegalPage";

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
  const path =
    lang === "fr" ? "/mentions-legales" : `/${lang}/mentions-legales`;

  return {
    title: t.legal.noticeTitle,
    description: t.legal.noticeIntro,
    alternates: { canonical: `${SITE}${path}` },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const t = getMessages(lang);

  return (
    <LegalPage
      lang={lang}
      t={t}
      title={t.legal.noticeTitle}
      intro={t.legal.noticeIntro}
    />
  );
}
