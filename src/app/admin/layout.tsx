import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/dossiers", label: "Dossiers" },
] as const;

const SOON = ["Clients", "Documents", "Notifications", "Paramètres"] as const;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(["admin", "super_admin"]);
  const user = await getCurrentUser();
  const initials =
    ((user?.firstName?.[0] ?? "A") + (user?.lastName?.[0] ?? "")).toUpperCase();
  const roleLabel =
    user?.role === "super_admin" ? "SUPER ADMIN" : "ADMINISTRATEUR";

  return (
    <div className="flex min-h-screen bg-surface text-body">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col bg-petrol-900 px-4 py-6 text-on-dark lg:flex">
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <span className="h-6 w-0.5 rounded bg-gold" />
          <span
            className="text-[21px] font-medium tracking-[0.1em] text-white"
            style={{ fontFamily: "var(--font-mark)" }}
          >
            F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
          </span>
          <span className="ml-auto rounded-full border border-petrol-600 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-teal-300">
            ADMIN
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((n) => (
            <AdminNavItem key={n.href} href={n.href} label={n.label} />
          ))}

          <p className="mb-2 mt-7 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-500">
            Système
          </p>
          {SOON.map((label) => (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] text-petrol-600"
            >
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-petrol-600" />
              {label}
              <span className="ml-auto rounded-full bg-petrol-800 px-1.5 py-px text-[9px] tracking-wide text-neutral-500">
                bientôt
              </span>
            </span>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 border-t border-line-ondark px-2 pt-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-petrol-800 text-[11px] font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-white">
              {user ? `${user.firstName} ${user.lastName}` : "Administrateur"}
            </span>
            <span className="font-mono text-[9px] tracking-[0.1em] text-neutral-500">
              {roleLabel}
            </span>
          </span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-[244px]">
        <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between border-b border-line bg-surface/85 px-5 backdrop-blur sm:px-8 lg:px-10">
          <Link
            href="/admin"
            className="text-[20px] font-semibold tracking-[-0.05em] text-strong lg:hidden"
          >
            fiduvia
          </Link>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-muted lg:block">
            Administration
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-petrol-900 text-[10px] font-medium text-white">
            {initials}
          </span>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-line bg-card px-2 py-2 lg:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex-1 rounded-lg px-3 py-2 text-center text-[12px] font-medium text-muted"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="min-h-[calc(100vh-64px)] pb-16 lg:pb-0">{children}</div>
      </div>
    </div>
  );
}

function AdminNavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-petrol-600 group-hover:bg-teal-400" />
      {label}
    </Link>
  );
}
