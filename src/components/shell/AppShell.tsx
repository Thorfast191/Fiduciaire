"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavEntry } from "./nav";

export interface ShellAccount {
  name: string;
  initials: string;
  /** Small mono caption under the name — "Espace client", "SUPER ADMIN", … */
  tag: string;
}

interface AppShellProps {
  variant: "client" | "admin";
  nav: NavEntry[];
  /** Topbar page title. */
  title: string;
  /** Topbar right-hand caption, rendered in mono uppercase. */
  meta?: string;
  account: ShellAccount;
  children: ReactNode;
}

const ACTIVE_BG = "rgba(63,167,160,0.16)";

/**
 * Longest-prefix match, so `/admin/dossiers` activates "Dossiers" rather than
 * also activating "Accueil" (`/admin`), which every `/admin/*` path prefixes.
 */
function activeHref(nav: NavEntry[], pathname: string): string | undefined {
  return nav
    .filter((e) => e.kind === "link")
    .map((e) => e.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

export function AppShell({
  variant,
  nav,
  title,
  meta,
  account,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const isAdmin = variant === "admin";

  // The mockup's admin topbar shows the active section's own label
  // (`aPageTitle`), while the client topbar always reads "Mon espace"
  // (`clientPageTitle` falls through to `t.mySpace` for the declarations
  // module). Deriving it from the nav keeps admin in step without threading a
  // title down from every page.
  const current = activeHref(nav, pathname);

  const activeLabel = isAdmin
    ? nav.find((e) => e.kind === "link" && e.href === current)?.label
    : undefined;

  const pageTitle = activeLabel ?? title;

  return (
    <div className="flex min-h-screen bg-surface text-body">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col self-start overflow-y-auto bg-petrol-900 px-4 py-[22px] text-on-dark lg:flex">
        <Brand isAdmin={isAdmin} />

        <nav className="flex flex-col gap-[3px]">
          {nav.map((entry, i) => (
            <NavRow
              key={`${entry.kind}-${entry.label}`}
              entry={entry}
              first={i === 0}
              current={current}
            />
          ))}
        </nav>

        <AccountBlock
          account={account}
          isAdmin={isAdmin}
          open={accountOpen}
          onToggle={() => setAccountOpen((v) => !v)}
        />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3.5 border-b border-line bg-surface/85 px-5 py-3.5 backdrop-blur-[8px] backdrop-saturate-[180%] sm:px-9">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="mr-2.5 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] border border-line bg-card lg:hidden"
          >
            <span className="flex w-[18px] flex-col gap-1">
              <span className="h-0.5 rounded-sm bg-strong" />
              <span className="h-0.5 rounded-sm bg-strong" />
              <span className="h-0.5 rounded-sm bg-strong" />
            </span>
          </button>

          <div className="disp truncate text-[20px] font-bold">{pageTitle}</div>

          <div className="flex items-center gap-3.5">
            {meta ? (
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-muted sm:block">
                {meta}
              </span>
            ) : null}
          </div>
        </div>

        {/* Mobile panel */}
        {menuOpen ? (
          <div
            onClick={() => setMenuOpen(false)}
            className="flex flex-col gap-0.5 border-b border-line-ondark bg-petrol-900 px-3 pb-3.5 pt-2.5 lg:hidden"
          >
            {nav.map((entry, i) => (
              <NavRow
                key={`m-${entry.kind}-${entry.label}`}
                entry={entry}
                first={i === 0}
                current={current}
                mobile
              />
            ))}

            <span className="my-2 h-px bg-line-ondark" />

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full px-3 py-3 text-left text-[15px] font-semibold text-on-dark"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        ) : null}

        <div className="w-full max-w-[1240px] px-5 pb-20 pt-8 sm:px-9">
          {children}
        </div>
      </div>
    </div>
  );
}

function Brand({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
      <span className="flex items-center gap-[11px] leading-none">
        <span
          className="w-0.5 shrink-0 rounded-[1px] bg-gold"
          style={{ height: isAdmin ? 24 : 28 }}
        />
        <span
          className="whitespace-nowrap font-medium tracking-[0.1em] text-white"
          style={{
            fontFamily: "var(--font-mark)",
            fontSize: isAdmin ? 21 : 24,
          }}
        >
          F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
        </span>
      </span>

      {isAdmin ? (
        <span className="rounded-full border border-petrol-600 px-1.5 py-0.5 font-mono text-[8px] tracking-[0.1em] text-teal-300">
          ADMIN
        </span>
      ) : null}
    </div>
  );
}

function NavRow({
  entry,
  first,
  current,
  mobile = false,
}: {
  entry: NavEntry;
  first: boolean;
  current: string | undefined;
  mobile?: boolean;
}) {
  if (entry.kind === "head") {
    return (
      <span
        className={[
          "block px-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-neutral-500",
          first ? "pb-1.5 pt-0.5" : "pb-1.5 pt-[18px]",
        ].join(" ")}
      >
        {entry.label}
      </span>
    );
  }

  const rowClass = [
    "flex items-center gap-[11px] rounded-lg",
    mobile ? "min-h-[44px] px-3 py-3.5" : "px-3 py-2.5",
  ].join(" ");

  if (entry.kind === "soon") {
    return (
      <span
        aria-disabled="true"
        title="Bientôt disponible"
        className={`${rowClass} cursor-not-allowed whitespace-nowrap text-[14.5px] font-medium text-neutral-400/55`}
      >
        <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-petrol-600/70" />
        {entry.label}
      </span>
    );
  }

  const active = entry.href === current;

  return (
    <Link
      href={entry.href}
      className={`${rowClass} text-[14.5px] transition-colors ${
        active
          ? "font-semibold text-white"
          : "font-medium text-neutral-400 hover:bg-white/5 hover:text-white"
      }`}
      style={active ? { background: ACTIVE_BG } : undefined}
    >
      <span
        className={`h-[7px] w-[7px] shrink-0 rounded-full ${
          active ? "bg-teal-400" : "bg-petrol-600"
        }`}
      />
      {entry.label}
    </Link>
  );
}

function AccountBlock({
  account,
  isAdmin,
  open,
  onToggle,
}: {
  account: ShellAccount;
  isAdmin: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onToggle();
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onToggle]);

  return (
    <div ref={ref} className="relative mt-auto">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-[11px] border-t border-line-ondark px-2.5 py-3 text-left"
      >
        <span
          className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full font-semibold text-white ${
            isAdmin
              ? "border-2 border-petrol-600 bg-petrol-800 text-[14px]"
              : "bg-teal-500 text-[15px]"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {account.initials}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-display text-[15px] font-bold leading-[1.1] text-white">
            {account.name}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-neutral-500">
            {account.tag}
          </span>
        </span>

        <span className="text-[15px] text-neutral-500">›</span>
      </button>

      {open ? (
        <div className="absolute inset-x-0 bottom-[calc(100%+6px)] z-50 rounded-xl border border-line-default bg-white p-1.5 shadow-[0_20px_44px_-18px_rgba(11,32,48,.5)]">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-body transition-colors hover:bg-sunken"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
