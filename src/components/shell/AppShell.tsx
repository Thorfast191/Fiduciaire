"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavEntry } from "./nav";
import { useT } from "@/lib/i18n/I18nProvider";
import { ProfileModal, type ProfileFields } from "./ProfileModal";
import { useCanton } from "./CantonContext";

export interface ShellAccount {
  name: string;
  initials: string;
  /** Small mono caption under the name — "Espace client", "SUPER ADMIN", … */
  tag: string;
  /** Editable fields behind "Mon profil". */
  profile: ProfileFields;
}

interface AppShellProps {
  variant: "client" | "admin";
  nav: NavEntry[];
  /** Topbar page title. */
  title: string;
  /** Topbar right-hand caption, rendered in mono uppercase. */
  meta?: string;
  /**
   * Route whose topbar keeps `title` instead of taking the nav entry's label.
   * The mockup's client topbar reads "Mon espace" on the declarations module
   * but the section's own name everywhere else.
   */
  titleFallbackFor?: string;
  account: ShellAccount;
  children: ReactNode;
}

const ACTIVE_BG = "rgba(63,167,160,0.16)";

/**
 * The mockup's simplified two-band canton flags (`Fiduvia.dc.html:1547`): a
 * white band and the canton's colour, stacked (Vaud/Fribourg) or side by side
 * (Valais). Keyed by the canton name we store on the declaration.
 */
const CANTON_FLAG: Record<
  string,
  { color: string; row: boolean }
> = {
  Vaud: { color: "#0B7A3B", row: false },
  Valais: { color: "#C8202E", row: true },
  Fribourg: { color: "#20232A", row: false },
};

function CantonFlagPill({ canton }: { canton: string }) {
  const flag = CANTON_FLAG[canton];
  if (!flag) return null;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-line bg-card py-[5px] pl-[7px] pr-[11px]"
    >
      <span
        className="flex h-[22px] w-[30px] shrink-0 overflow-hidden rounded-[5px] border border-[rgba(0,0,0,0.14)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        style={{ flexDirection: flag.row ? "row" : "column" }}
        aria-hidden="true"
      >
        <span className="flex-1 bg-white" />
        <span className="flex-1" style={{ background: flag.color }} />
      </span>
      <span className="text-[13px] font-bold text-strong">{canton}</span>
    </span>
  );
}

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
  titleFallbackFor,
  account,
  children,
}: AppShellProps) {
  const t = useT();
  const { canton } = useCanton();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  function openProfile() {
    setAccountOpen(false);
    setMenuOpen(false);
    setProfileOpen(true);
  }

  const isAdmin = variant === "admin";

  // Both topbars show the active section's own label (`aPageTitle` /
  // `clientPageTitle`), except on the route named by `titleFallbackFor`, which
  // keeps the area's title. Deriving it from the nav avoids threading a title
  // down from every page.
  const current = activeHref(nav, pathname);

  const activeLabel =
    current && current !== titleFallbackFor
      ? nav.find((e) => e.kind === "link" && e.href === current)?.label
      : undefined;

  const pageTitle = activeLabel ?? title;

  return (
    <div className="flex min-h-screen bg-surface text-body">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col self-start overflow-hidden bg-petrol-900 px-4 py-[22px] text-on-dark lg:flex">
        <div className="shrink-0">
          <Brand isAdmin={isAdmin} />
        </div>

        {/* Only the nav scrolls: the wordmark and the account block stay put,
            so on a short window the profile and logout are always reachable.
            `min-h-0` lets this flex child shrink below its content height. */}
        <nav className="flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto">
          {nav.map((entry, i) => (
            <NavRow
              key={`${entry.kind}-${entry.label}`}
              entry={entry}
              first={i === 0}
              current={current}
              soonTitle={t.common.comingSoonTitle}
            />
          ))}
        </nav>

        <AccountBlock
          profileLabel={t.portal.profile.menu}
          onOpenProfile={openProfile}
          logoutLabel={t.portal.logout}
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
            aria-label={t.nav.menu}
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
            {canton ? <CantonFlagPill canton={canton} /> : null}
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
                soonTitle={t.common.comingSoonTitle}
                mobile
              />
            ))}

            <span className="my-2 h-px bg-line-ondark" />

            <button
              type="button"
              onClick={openProfile}
              className="w-full px-3 py-3 text-left text-[15px] font-semibold text-on-dark"
            >
              {t.portal.profile.menu}
            </button>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full px-3 py-3 text-left text-[15px] font-semibold text-on-dark"
              >
                {t.portal.logout}
              </button>
            </form>
          </div>
        ) : null}

        <div className="w-full max-w-[1240px] px-5 pb-20 pt-8 sm:px-9">
          {children}
        </div>

        {profileOpen ? (
          <ProfileModal
            t={t}
            fields={account.profile}
            onClose={() => setProfileOpen(false)}
          />
        ) : null}
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
  soonTitle,
  mobile = false,
}: {
  entry: NavEntry;
  first: boolean;
  current: string | undefined;
  soonTitle: string;
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
        title={soonTitle}
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
  profileLabel,
  onOpenProfile,
  logoutLabel,
}: {
  account: ShellAccount;
  isAdmin: boolean;
  open: boolean;
  onToggle: () => void;
  profileLabel: string;
  onOpenProfile: () => void;
  logoutLabel: string;
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
    <div ref={ref} className="relative mt-auto shrink-0 pt-4">
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
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-full rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-body transition-colors hover:bg-sunken"
          >
            {profileLabel}
          </button>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2.5 text-left text-[14px] font-medium text-body transition-colors hover:bg-sunken"
            >
              {logoutLabel}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
