import type { ReactNode } from "react";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/shell/AppShell";
import { clientNav } from "@/components/shell/nav";
import { CantonProvider } from "@/components/shell/CantonContext";
import { listDossiersForClient } from "@/lib/dossiers";
import { normaliseAnswers } from "@/lib/declaration";
import { getT } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["client"]);

  const [user, { locale, t }] = await Promise.all([getCurrentUser(), getT()]);

  // The topbar shows the canton flag once the client has picked one on a
  // declaration; dossiers come back newest-year first, so the first with a
  // canton is the most recent choice.
  const declarations = user
    ? await listDossiersForClient(user.id, "declaration")
    : [];
  const canton =
    declarations
      .map((d) => normaliseAnswers(d.answers).canton)
      .find((c) => c) || undefined;

  const firstName = user?.firstName || "Client";
  const lastName = user?.lastName || "";
  const initials = ((firstName[0] ?? "C") + (lastName[0] ?? "")).toUpperCase();

  return (
    <I18nProvider locale={locale} messages={t}>
      <div lang={locale}>
        <CantonProvider initial={canton}>
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
        </CantonProvider>
      </div>
    </I18nProvider>
  );
}
