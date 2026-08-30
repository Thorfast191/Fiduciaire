import type { Metadata } from "next";
import {
  Geist_Mono,
  Hanken_Grotesk,
  Schibsted_Grotesk,
} from "next/font/google";
import "./globals.css";

const displayFont = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const textFont = Hanken_Grotesk({
  variable: "--font-text",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
    <html lang="fr">
      <body
        className={`${displayFont.variable} ${textFont.variable} ${monoFont.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
