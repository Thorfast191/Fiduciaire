"use client";

import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * The marketing site opens login as a modal, the way the mockup does. This
 * route is the same card on its own page — reached by deep link, by the
 * redirect off a protected route, and by anyone without JavaScript.
 */
export default function LoginPage() {
  const t = useT();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] p-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-[16px] leading-none">
            <span className="h-[34px] w-[3px] shrink-0 rounded-[1px] bg-[var(--gold)]" />

            <span
              className="whitespace-nowrap text-[30px] font-medium tracking-[0.1em] text-[var(--text-strong)]"
              style={{ fontFamily: "var(--font-mark)" }}
            >
              F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
            </span>
          </Link>
        </div>

        <div className="mt-7 rounded-[var(--radius-xl)] bg-[var(--surface-card)] px-8 py-[34px] shadow-[0_40px_90px_-30px_rgba(11,32,48,.25)]">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-[var(--teal-100)] text-[var(--brand)]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>

          <LoginForm t={t} />
        </div>
      </div>
    </main>
  );
}
