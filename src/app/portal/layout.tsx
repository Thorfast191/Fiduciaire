import type { ReactNode } from "react";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";
import { AppShell } from "@/components/shell/AppShell";
import { CLIENT_NAV } from "@/components/shell/nav";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["client"]);

  const user = await getCurrentUser();

  const firstName = user?.firstName || "Client";
  const lastName = user?.lastName || "";
  const initials = (
    (firstName[0] ?? "C") + (lastName[0] ?? "")
  ).toUpperCase();

  return (
    <AppShell
      variant="client"
      nav={CLIENT_NAV}
      title="Mon espace"
      meta={`Période ${new Date().getFullYear() - 1}`}
      account={{
        name: `${firstName} ${lastName}`.trim(),
        initials,
        tag: "Espace client",
      }}
    >
      {children}
    </AppShell>
  );
}
