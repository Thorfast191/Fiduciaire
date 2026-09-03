"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * The mockup's "Période 20xx" pill and dropdown (`Fiduvia.dc.html:2972`,
 * `makePeriodPicker`). The choice is carried in the `?periode=` query string
 * so the server components on the page can scope their queries to it and the
 * selection survives a reload or a shared link.
 */
export function PeriodPicker({
  years,
  current,
}: {
  years: number[];
  current: number;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function select(year: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("periode", String(year));
    setOpen(false);
    router.push(`${pathname}?${next.toString()}`);
  }

  // With a single period there is nothing to choose between, so the pill stays
  // static rather than offering a menu of one.
  if (years.length < 2) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line-default bg-card px-4 py-2.5 text-[14px] font-semibold text-strong">
        {t.admin.period} {current}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded-full border border-line-default bg-card px-4 py-2.5 text-[14px] font-semibold text-strong transition-colors hover:border-line-strong"
      >
        {t.admin.period} {current}
        <span className="flex text-muted" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path
              d="m6 8 4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[160px] rounded-xl border border-line-default bg-white p-1.5 shadow-[0_20px_44px_-18px_rgba(11,32,48,.4)]"
        >
          {years.map((year) => {
            const active = year === current;

            return (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => select(year)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors ${
                  active
                    ? "bg-teal-100 font-bold text-brand"
                    : "font-medium text-body hover:bg-sunken"
                }`}
              >
                {t.admin.period} {year}
                <span aria-hidden="true">{active ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
