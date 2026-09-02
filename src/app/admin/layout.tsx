import type { ReactNode } from "react";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/shell/AppShell";
import { ADMIN_NAV } from "@/components/shell/nav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["admin", "super_admin"]);

  const user = await getCurrentUser();

  const initials = (
    (user?.firstName?.[0] ?? "A") + (user?.lastName?.[0] ?? "")
  ).toUpperCase();

  return (
    <AppShell
      variant="admin"
      nav={ADMIN_NAV}
      title="Administration"
      meta={`Période ${new Date().getFullYear() - 1}`}
      account={{
        name: user ? `${user.firstName} ${user.lastName}` : "Administrateur",
        initials,
        tag: user?.role === "super_admin" ? "Super admin" : "Administrateur",
      }}
    >
      {children}
    </AppShell>
  );
}
