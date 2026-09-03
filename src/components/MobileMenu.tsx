"use client";

import { useState } from "react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";

/**
 * The marketing header's burger, which was previously a button with no handler.
 * The nav links are hidden below `md`, so without this there is no way to reach
 * any section on a phone.
 */
export function MobileMenu({ t }: { t: Messages }) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#steps", label: t.nav.method },
    { href: "#tarifs", label: t.nav.pricing },
    { href: "#faq", label: t.nav.faq },
    { href: "#contact", label: t.footer.contact },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={t.nav.menu}
        className="flex border-0 bg-transparent p-2 md:hidden"
      >
        <span className="flex w-[19px] flex-col gap-[4px]">
          <span className="h-[2px] rounded-[2px] bg-[var(--text-strong)]" />
          <span className="h-[2px] rounded-[2px] bg-[var(--text-strong)]" />
          <span className="h-[2px] rounded-[2px] bg-[var(--text-strong)]" />
        </span>
      </button>

      {open ? (
        <div
          id="mobile-menu"
          onClick={() => setOpen(false)}
          className="absolute inset-x-0 top-full flex flex-col border-b border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 py-3 shadow-[var(--shadow-md)] md:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="border-b border-[var(--border-subtle)] py-3 text-[15px] font-medium text-[var(--text-body)] last:border-b-0"
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
