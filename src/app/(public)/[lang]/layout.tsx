import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { LoginModalProvider } from "@/components/auth/LoginModal";
import { getMessages } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/config";

/**
 * Holds the login modal for the marketing pages. The locale comes from the URL
 * rather than the cookie so these routes stay statically renderable.
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
