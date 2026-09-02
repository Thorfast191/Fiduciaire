import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["client"]);

  const user = await getCurrentUser();

  const firstName = user?.firstName || "Client";
  const lastName = user?.lastName || "";

  return (
    <div className="min-h-screen bg-surface text-strong">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-7 lg:px-10">
          {/* Brand */}
          <Link
            href="/portal"
            className="text-[23px] font-semibold tracking-[-0.05em] text-strong"
          >
            fiduvia
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            <PortalNavItem href="/portal" label="Tableau de bord" />

            <PortalNavItem href="/portal/documents" label="Documents" />

            <PortalNavItem href="/portal/payments" label="Paiements" />
          </nav>

          {/* Account */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-medium text-strong">
                {firstName} {lastName}
              </p>

              <p className="mt-0.5 text-[10px] text-subtle">Espace client</p>
            </div>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-petrol-900 text-[10px] font-medium text-white"
              aria-label={`Compte de ${firstName} ${lastName}`}
            >
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <div className="border-b border-line bg-card md:hidden">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
          <PortalNavItem href="/portal" label="Tableau de bord" mobile />

          <PortalNavItem href="/portal/documents" label="Documents" mobile />

          <PortalNavItem href="/portal/payments" label="Paiements" mobile />
        </nav>
      </div>

      {/* Page content */}
      <main className="min-h-[calc(100vh-72px)]">{children}</main>
    </div>
  );
}

function PortalNavItem({
  href,
  label,
  mobile = false,
}: {
  href: string;
  label: string;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "whitespace-nowrap rounded-lg font-medium text-muted",
        "transition hover:bg-sunken hover:text-strong",
        mobile ? "px-3 py-2 text-[11px]" : "px-3 py-2 text-[12px]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
