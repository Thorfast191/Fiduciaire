import type { ReactNode } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["admin", "super_admin"]);

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-[#17231D]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] border-r border-[#E1E6E2] bg-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-[72px] items-center border-b border-[#ECEFEC] px-6">
          <Link
            href="/admin"
            className="text-[23px] font-semibold tracking-[-0.05em]"
          >
            fiduvia
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9AA29D]">
            Administration
          </p>

          <div className="space-y-1">
            <AdminNavItem
              href="/admin"
              label="Tableau de bord"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[17px] w-[17px]"
                >
                  <rect x="4" y="4" width="6" height="6" rx="1" />
                  <rect x="14" y="4" width="6" height="6" rx="1" />
                  <rect x="4" y="14" width="6" height="6" rx="1" />
                  <rect x="14" y="14" width="6" height="6" rx="1" />
                </svg>
              }
            />

            <AdminNavItem
              href="/admin/dossiers"
              label="Dossiers fiscaux"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[17px] w-[17px]"
                >
                  <path d="M5 4h10l4 4v12H5z" />
                  <path d="M14 4v5h5" />
                  <path d="M9 13h6M9 17h5" />
                </svg>
              }
            />

            <AdminNavItem
              href="/admin/clients"
              label="Clients"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[17px] w-[17px]"
                >
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                  <path d="M16 11a3 3 0 0 1 4 2.8" />
                  <path d="M16.5 19a4.5 4.5 0 0 1 4-2.4" />
                </svg>
              }
            />

            <AdminNavItem
              href="/admin/documents"
              label="Documents"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[17px] w-[17px]"
                >
                  <path d="M6 3h9l3 3v15H6z" />
                  <path d="M14 3v4h4" />
                  <path d="M9 12h6M9 16h6" />
                </svg>
              }
            />
          </div>

          <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9AA29D]">
            Système
          </p>

          <div className="space-y-1">
            <AdminNavItem
              href="/admin/notifications"
              label="Notifications"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[17px] w-[17px]"
                >
                  <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>
              }
            />

            <AdminNavItem
              href="/admin/settings"
              label="Paramètres"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[17px] w-[17px]"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.4v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1H15v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
                </svg>
              }
            />
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-[#ECEFEC] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#F7F9F7] p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#17231D] text-[10px] font-medium text-white">
              AD
            </div>

            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-[#29342E]">
                Administration
              </p>
              <p className="text-[10px] text-[#8A938D]">Espace sécurisé</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-[240px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#E1E6E2] bg-white/95 px-5 backdrop-blur sm:px-7 lg:px-10">
          {/* Mobile logo */}
          <Link
            href="/admin"
            className="text-[22px] font-semibold tracking-[-0.05em] lg:hidden"
          >
            fiduvia
          </Link>

          <div className="hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A938D]">
              Administration
            </p>
            <p className="mt-0.5 text-[12px] text-[#68736D]">
              Gestion de votre activité
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 text-[12px] font-medium text-[#68736D] transition hover:bg-[#F5F7F5] hover:text-[#17231D] sm:block"
            >
              Voir le site
            </Link>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17231D] text-[10px] font-medium text-white">
              AD
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="min-h-[calc(100vh-72px)]">{children}</div>
      </div>
    </div>
  );
}

function AdminNavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#68736D] transition hover:bg-[#F2F5F2] hover:text-[#17231D]"
    >
      <span className="text-[#89948D] transition group-hover:text-[#536B5C]">
        {icon}
      </span>

      {label}
    </Link>
  );
}
