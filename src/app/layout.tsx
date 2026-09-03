import type { Metadata } from "next";
import {
  EB_Garamond,
  Geist_Mono,
  Hanken_Grotesk,
  Schibsted_Grotesk,
} from "next/font/google";

import "./globals.css";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

const displayFont = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const textFont = Hanken_Grotesk({
  variable: "--font-text",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const markFont = EB_Garamond({
  variable: "--font-mark",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fiduvia.ch";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Fiduvia",
    template: "%s · Fiduvia",
  },
  description: "Fiduvia — fiduciaire et comptabilité 100% en ligne en Suisse.",
};

/**
 * `<html lang>` carries the site's default language. Pages served in another
 * locale re-declare it on their own root element — the document-level default
 * cannot vary here without reading a cookie, which would mark every route
 * dynamic and stop the marketing pages from prerendering.
 *
 * There is deliberately no `force-dynamic`: `/portal` and `/admin` opt into
 * dynamic rendering by reading the session cookie, while `/fr` and `/en` are
 * static, which is what the French-SEO work needs.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${displayFont.variable} ${textFont.variable} ${monoFont.variable} ${markFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
