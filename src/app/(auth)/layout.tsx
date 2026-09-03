import type { ReactNode } from "react";
import { getT } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

/**
 * Auth routes are self-contained pages: each renders its own `<main>`, brand
 * mark and footer (the SP-1 reskin styled them in place rather than through a
 * shared card). This layout therefore only establishes the language — it used
 * to render a second brand block and a second `<main>`, which nested `<main>`
 * elements and printed the wordmark twice on every auth screen.
 */
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { locale, t } = await getT();

  return (
    <I18nProvider locale={locale} messages={t}>
      <div lang={locale}>{children}</div>
    </I18nProvider>
  );
}
