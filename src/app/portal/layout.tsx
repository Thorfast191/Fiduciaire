import type { ReactNode } from "react";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/shell/AppShell";
import { clientNav } from "@/components/shell/nav";
import { getT } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["client"]);

  const [user, { locale, t }] = await Promise.all([getCurrentUser(), getT()]);

  const firstName = user?.firstName || "Client";
  const lastName = user?.lastName || "";
  const initials = ((firstName[0] ?? "C") + (lastName[0] ?? "")).toUpperCase();

  return (
    <I18nProvider locale={locale} messages={t}>
      <div lang={locale}>
        <AppShell
          variant="client"
          nav={clientNav(t)}
          title={t.portal.spaceTitle}
          titleFallbackFor="/portal"
          meta={`${t.admin.fiscalPeriod} ${new Date().getFullYear() - 1}`}
          account={{
            name: `${firstName} ${lastName}`.trim(),
            initials,
            tag: t.portal.spaceTag,
            profile: {
              firstName,
              lastName,
              email: user?.email ?? "",
              phone: user?.phone ?? "",
              initials,
            },
          }}
        >
          {children}
        </AppShell>
      </div>
    </I18nProvider>
  );
}
