import type { Metadata } from "next";
import {
  EB_Garamond,
  Geist_Mono,
  Hanken_Grotesk,
  Schibsted_Grotesk,
} from "next/font/google";

import "./globals.css";

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

export const metadata: Metadata = {
  title: "Fiduvia",
  description: "Fiduvia — fiduciaire et comptabilité 100% en ligne en Suisse.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${displayFont.variable} ${textFont.variable} ${monoFont.variable} ${markFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
