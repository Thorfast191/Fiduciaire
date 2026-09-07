import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LoginModalProvider } from "@/components/auth/LoginModal";
import { getMessages } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/config";

/**
 * Rendered per request, not prerendered — which these pages cannot be.
 *
 * The CSP in `src/proxy.ts` allows scripts by per-request nonce. A nonce can
 * only be stamped into HTML that is generated per request; a prerendered page
 * is built long before the nonce exists, so its inline scripts carry none and
 * the browser blocks them. That kills hydration outright: the login modal never
 * opens, the trigger falls back to a plain link, and every client component on
 * the marketing site is inert. `next dev` renders dynamically, so this only
 * appears once the app is built.
 *
 * Marketing pages are cheap to render and sit behind a CDN, so paying for
 * dynamic rendering is the right side of this trade — the alternative is
 * dropping the nonce and allowing `unsafe-inline` scripts everywhere.
 */
export const dynamic = "force-dynamic";

/**
 * Holds the login modal for the marketing pages. The locale comes from the URL
 * rather than the cookie so it does not have to read the cookie store here.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <LoginModalProvider t={getMessages(lang)}>{children}</LoginModalProvider>
  );
}
