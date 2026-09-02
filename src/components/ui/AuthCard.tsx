import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[480px] flex-col justify-center">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-block text-[27px] font-semibold tracking-[-0.04em] text-strong"
        >
          fiduvia
        </Link>
        <p className="mt-1.5 text-[13px] text-muted">
          Fiduciaire &amp; comptabilité en ligne
        </p>
      </div>

      <section className="rounded-[20px] border border-line bg-card px-6 py-8 shadow-md sm:px-10 sm:py-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-brand">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>

        <div className="mt-6">
          <h1 className="text-[29px] font-semibold leading-[1.15] tracking-[-0.04em] text-strong">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[14px] leading-6 text-muted">{subtitle}</p>
          )}
        </div>

        {children}
      </section>

      {footer && (
        <div className="mt-6 text-center text-[13px] text-muted">{footer}</div>
      )}

      <p className="mt-7 text-center text-[11px] leading-5 text-subtle">
        © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement en
        ligne.
      </p>
    </div>
  );
}
