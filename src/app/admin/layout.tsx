import type { ReactNode } from "react";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/shell/AppShell";
import { adminNav } from "@/components/shell/nav";
import { getT } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["admin", "super_admin"]);

  const [user, { locale, t }] = await Promise.all([getCurrentUser(), getT()]);

  const initials = (
    (user?.firstName?.[0] ?? "A") + (user?.lastName?.[0] ?? "")
  ).toUpperCase();

  return (
    <I18nProvider locale={locale} messages={t}>
      <div lang={locale}>
        <AppShell
          variant="admin"
          nav={adminNav(t)}
          title={t.admin.title}
          meta={`${t.admin.fiscalPeriod} ${new Date().getFullYear() - 1}`}
          account={{
            name: user
              ? `${user.firstName} ${user.lastName}`
              : t.admin.roleAdmin,
            initials,
            profile: {
              firstName: user?.firstName ?? "",
              lastName: user?.lastName ?? "",
              email: user?.email ?? "",
              phone: user?.phone ?? "",
              initials,
            },
            tag:
              user?.role === "super_admin"
                ? t.admin.roleSuper
                : t.admin.roleAdmin,
          }}
        >
          {children}
        </AppShell>
      </div>
    </I18nProvider>
  );
}
