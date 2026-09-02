# Fluxio Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the auth screens, client portal, and admin section off their hardcoded green-grey palette onto the full Fluxio design-system tokens, and redesign the admin shell (dark petrol sidebar) and dashboard (real data).

**Architecture:** One `globals.css` token layer holds the complete Fluxio palette/scale and exposes it to Tailwind v4 via `@theme inline`. Four tiny presentational components (`AuthCard`, `Field`/`FormAlert`, `StatCard`, `StatusBadge`) absorb repeated markup. Every page is then reclassed to token utilities with structure and copy unchanged, except `admin/page.tsx` which gains one read-only aggregate query (`getAdminDashboardStats`).

**Tech Stack:** Next.js 16.3.2 (App Router, this repo's modified build — see `AGENTS.md`), React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/postcss`), Drizzle ORM + Postgres, Vitest (node env), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-02-fluxio-reskin-design.md` — read it alongside this plan.

## Global Constraints

- **No behaviour change.** No auth, session, RBAC, route, middleware (`src/proxy.ts`), or API change. The only new server code is `src/lib/adminStats.ts` (read-only aggregate reads).
- **Strings byte-identical.** Every user-facing string, every `<label htmlFor>` / input `id` pair, and every `placeholder` value stays exactly as it is today. This is what keeps the 11 Playwright E2E tests green. Specifically preserve: `"Adresse e-mail"` (label), `"vous@exemple.ch"` / `"E-mail"` / `"000000"` (placeholders), button text `"Se connecter"`, `"Créer mon compte"`, `"Vérifier le code"`, `"Réinitialiser le mot de passe"`, `"Marquer comme soumis"`, `"Télécharger"`, `"Supprimer"`, and the dossier status words `"Non commencé"` / `"Soumis"` / `"En cours de traitement"` / `"Terminé"`.
- **No new dependencies.** No `@testing-library/react`, no `next-intl` (that's sub-project 3), nothing.
- **Design tokens are the only colour source.** After Task 1, no new hardcoded hex in `src/app/**` or `src/components/**` except inside `globals.css`. Existing hex in `src/app/page.tsx` (marketing) is left alone.
- **Read `AGENTS.md` before writing any code.** This is a modified Next.js; check `node_modules/next/dist/docs/` for anything non-obvious. Middleware lives at `src/proxy.ts` (not `middleware.ts`) and is not touched here.
- **Gates after every task:** `npx tsc --noEmit` (exit 0), `npm run lint` (0 errors; warnings OK), `npm run build` (exit 0). Tasks 3, 4, 6, 7, 8 additionally run `npm run test:e2e` (all 11 pass). Docker stack must be up (`docker compose up -d`) for E2E and for Task 5's vitest.
- **Branch:** `fluxio-reskin` (already created; the spec commit is `b44a81a`).

---

## File Structure

**Created:**
- `src/components/ui/AuthCard.tsx` — auth-screen chrome (brand mark, title, subtitle, footer slot). Server component.
- `src/components/ui/Field.tsx` — `Field` (label+input, preserves `htmlFor`/`id`) and `FormAlert` (`role="alert"|"status"` box). Client-safe.
- `src/components/ui/StatCard.tsx` — KPI card (eyebrow label, figure, hint). Server component.
- `src/components/ui/StatusBadge.tsx` — dossier status pill; owns `STATUS_LABELS` (single source). Server component.
- `src/lib/adminStats.ts` — `getAdminDashboardStats()`, read-only Drizzle aggregates on `dossiers` / `users`.
- `tests/unit/adminStats.test.ts` — Vitest, real local Postgres.

**Modified:**
- `src/app/globals.css` — replace the partial `:root` palette with the full Fluxio token set + `@theme inline` block + `--gold` + 4 status token pairs. Keep all non-token rules.
- `src/app/(auth)/layout.tsx` — render `AuthCard` chrome.
- `src/app/(auth)/login/page.tsx`, `signup/page.tsx`, `verify/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` — reclass to tokens + `Field`/`FormAlert`.
- `src/app/portal/layout.tsx`, `portal/page.tsx`, `portal/error.tsx`, `portal/DossierList.tsx`, `portal/dossiers/[id]/page.tsx`, `portal/dossiers/[id]/DossierDetail.tsx` — reclass to tokens; use `StatusBadge` / `FormAlert`.
- `src/app/admin/layout.tsx` — dark petrol left-sidebar shell.
- `src/app/admin/page.tsx` — consume `getAdminDashboardStats()`; `StatCard`s + status strip + tax-year bars.
- `src/app/admin/dossiers/page.tsx`, `admin/error.tsx` — reclass to tokens + `Field`/`FormAlert`/`StatusBadge`.

**Not touched:** `src/app/page.tsx` (marketing), `src/app/layout.tsx`, `src/app/error.tsx` (root — optional token swap only if trivial), `src/proxy.ts`, `next.config.ts`, everything under `src/lib/**` except the new `adminStats.ts`, all API routes, all `src/db/**`.

---

## Task 1: Fluxio token layer in `globals.css`

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind utilities `bg-surface` `bg-card` `bg-sunken` `bg-inverse` `text-strong` `text-body` `text-muted` `text-subtle` `text-on-dark` `border-line` `border-line-default` `border-line-strong` `border-line-ondark` `bg-brand` `text-brand` `ring-brand` `bg-brand-hover` `text-accent` `text-gold` `bg-petrol-{950,900,800,700,600}` `bg-teal-{50,100,200,300,400,500,600,700}` `text-teal-*` `bg-green-100` `text-green-600` `bg-amber-100` `text-amber-600` `bg-red-100` `text-red-600` `bg-status-{not-started,submitted,in-review,completed}` `bg-status-{...}-soft` `text-status-{...}`. All `--*` tokens from Fluxio `colors.css` / `typography.css` (vars only) / `spacing.css` remain available as raw `var(--*)`.

- [ ] **Step 1: Read the reference token files**

Run:
```bash
cat "Fiduciaire (4)/_ds/design-system-16c37d22-ce07-4262-affa-55376831535b/tokens/colors.css"
cat "Fiduciaire (4)/_ds/design-system-16c37d22-ce07-4262-affa-55376831535b/tokens/typography.css"
cat "Fiduciaire (4)/_ds/design-system-16c37d22-ce07-4262-affa-55376831535b/tokens/spacing.css"
```
These are the authoritative values. Copy variable declarations verbatim (colours, `--font-*`, `--fw-*`, `--text-*`, `--leading-*`, `--tracking-*`, `--space-*`, `--container-*`, `--gutter`, `--radius-*`, `--border-width`, `--shadow-*`, `--ease-*`, `--dur-*`). Do **not** copy `typography.css`'s `body` / `h1…h5` element rules or `fonts.css`.

- [ ] **Step 2: Rewrite the top of `globals.css`**

Replace everything from `@import "tailwindcss";` through the end of the current `:root { … }` block with:

```css
@import "tailwindcss";

/* =========================================================
   FLUXIO DESIGN SYSTEM — tokens (first-party copy of
   Fiduciaire (4)/_ds/.../tokens/*). Fonts stay via next/font
   in src/app/layout.tsx.
========================================================= */

:root {
  /* ---- Petrol ---- */
  --petrol-950: #081823;
  --petrol-900: #0b2030;
  --petrol-800: #0f2a3f;
  --petrol-700: #143a52;
  --petrol-600: #1b4d67;

  /* ---- Teal ---- */
  --teal-700: #145863;
  --teal-600: #1b6e7e;
  --teal-500: #2a8a93;
  --teal-400: #3fa7a0;
  --teal-300: #79c5bd;
  --teal-200: #aeddd7;
  --teal-100: #d9efec;
  --teal-50:  #eef8f6;

  /* ---- Sand / Cream ---- */
  --sand-400: #d8cfbd;
  --sand-300: #e8e2d5;
  --sand-200: #f2ece0;
  --sand-100: #faf7f0;

  /* ---- Neutrals (warm) ---- */
  --neutral-0:   #ffffff;
  --neutral-50:  #f7f6f2;
  --neutral-100: #efede7;
  --neutral-200: #e3e0d8;
  --neutral-300: #ccc8bd;
  --neutral-400: #a8a498;
  --neutral-500: #807c72;
  --neutral-600: #5e5b52;
  --neutral-700: #423f39;
  --neutral-800: #2a2824;
  --neutral-900: #1a1916;

  /* ---- Semantic feedback ---- */
  --green-600: #2e7d5b;
  --green-100: #dcefe5;
  --amber-600: #b9842b;
  --amber-100: #f6ebd3;
  --red-600:   #b5462f;
  --red-100:   #f6e0da;

  /* ---- Gold (marketing only; not in Fluxio) ---- */
  --gold: #c4a265;

  /* ---- Semantic aliases ---- */
  --text-strong:  var(--petrol-800);
  --text-body:    #2c3a42;
  --text-muted:   var(--neutral-500);
  --text-subtle:  var(--neutral-400);
  --text-on-dark: #eaf1f0;
  --text-on-teal: #ffffff;
  --text-link:    var(--teal-600);

  --surface-page:    var(--sand-100);
  --surface-card:    var(--neutral-0);
  --surface-sunken:  var(--sand-200);
  --surface-inverse: var(--petrol-800);
  --surface-teal:    var(--teal-600);
  --surface-cream:   var(--sand-300);

  --border-subtle:  var(--neutral-200);
  --border-default: var(--neutral-300);
  --border-strong:  var(--neutral-400);
  --border-ondark:  rgba(255, 255, 255, 0.14);

  --brand:        var(--teal-600);
  --brand-hover:  var(--teal-700);
  --brand-active: #0f4751;
  --brand-soft:   var(--teal-100);
  --accent:       var(--teal-400);
  --focus-ring:   rgba(63, 167, 160, 0.45);

  /* ---- Dossier status (derived from Fiduvia.dc.html statusMeta) ---- */
  --status-not-started:      #8a93a1;
  --status-not-started-soft: #f0f2f6;
  --status-submitted:        #6b4fc0;
  --status-submitted-soft:   #efeafb;
  --status-in-review:        #0e7c86;
  --status-in-review-soft:   #ddf3f4;
  --status-completed:        #145863;
  --status-completed-soft:   #d9efec;

  /* ---- Backward-compat: names used by src/app/page.tsx ---- */
  --background: var(--sand-100);
  --foreground: #2c3a42;
  --sand-500: var(--neutral-400);
  --muted: var(--neutral-500);

  /* ---- Typography (Fluxio typography.css vars only) ---- */
  --font-display: "Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif;
  --font-text:
    "Hanken Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica,
    Arial, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --font-mark: "EB Garamond", Georgia, "Times New Roman", serif;

  --fw-light: 300;
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semi: 600;
  --fw-bold: 700;
  --fw-black: 800;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.375rem;
  --text-xl: 1.75rem;
  --text-2xl: 2.25rem;
  --text-3xl: 3rem;
  --text-4xl: 3.75rem;
  --text-5xl: 4.75rem;

  --leading-tight: 1.06;
  --leading-snug: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;

  --tracking-tighter: -0.03em;
  --tracking-tight: -0.018em;
  --tracking-normal: 0;
  --tracking-wide: 0.04em;
  --tracking-caps: 0.14em;

  /* ---- Spacing / layout / radii / shadows / motion (Fluxio spacing.css) ---- */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --space-9: 6rem;
  --space-10: 8rem;

  --container-max: 1200px;
  --container-narrow: 760px;
  --gutter: clamp(1.25rem, 5vw, 4rem);

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 28px;
  --radius-pill: 999px;

  --border-width: 1px;

  --shadow-xs: 0 1px 2px rgba(15, 42, 63, 0.06);
  --shadow-sm: 0 2px 8px rgba(15, 42, 63, 0.07);
  --shadow-md: 0 8px 24px rgba(15, 42, 63, 0.08);
  --shadow-lg: 0 20px 48px rgba(15, 42, 63, 0.12);
  --shadow-teal: 0 12px 28px rgba(27, 110, 126, 0.22);

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 140ms;
  --dur-base: 240ms;
  --dur-slow: 420ms;
}

/* =========================================================
   TAILWIND v4 THEME — expose tokens as semantic utilities.
   `inline` keeps :root as the single source of truth, so a
   later :root override still wins.
========================================================= */

@theme inline {
  --color-surface: var(--surface-page);
  --color-card: var(--surface-card);
  --color-sunken: var(--surface-sunken);
  --color-inverse: var(--surface-inverse);
  --color-cream: var(--surface-cream);

  --color-strong: var(--text-strong);
  --color-body: var(--text-body);
  --color-muted: var(--text-muted);
  --color-subtle: var(--text-subtle);
  --color-on-dark: var(--text-on-dark);

  --color-line: var(--border-subtle);
  --color-line-default: var(--border-default);
  --color-line-strong: var(--border-strong);
  --color-line-ondark: var(--border-ondark);

  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-soft: var(--brand-soft);
  --color-accent: var(--accent);
  --color-gold: var(--gold);

  --color-petrol-950: var(--petrol-950);
  --color-petrol-900: var(--petrol-900);
  --color-petrol-800: var(--petrol-800);
  --color-petrol-700: var(--petrol-700);
  --color-petrol-600: var(--petrol-600);

  --color-teal-50: var(--teal-50);
  --color-teal-100: var(--teal-100);
  --color-teal-200: var(--teal-200);
  --color-teal-300: var(--teal-300);
  --color-teal-400: var(--teal-400);
  --color-teal-500: var(--teal-500);
  --color-teal-600: var(--teal-600);
  --color-teal-700: var(--teal-700);

  --color-green-600: var(--green-600);
  --color-green-100: var(--green-100);
  --color-amber-600: var(--amber-600);
  --color-amber-100: var(--amber-100);
  --color-red-600: var(--red-600);
  --color-red-100: var(--red-100);

  --color-status-not-started: var(--status-not-started);
  --color-status-not-started-soft: var(--status-not-started-soft);
  --color-status-submitted: var(--status-submitted);
  --color-status-submitted-soft: var(--status-submitted-soft);
  --color-status-in-review: var(--status-in-review);
  --color-status-in-review-soft: var(--status-in-review-soft);
  --color-status-completed: var(--status-completed);
  --color-status-completed-soft: var(--status-completed-soft);
}
```

Keep **all rules below the old `:root` block unchanged** (`html`, `body`, box-model, typography `h1..h6`/`p`, links, forms, images, `.fx-eyebrow`, `.disp`, `.fx-figure`, `.fid-nav`, `.fid-navlink`, `.fid-lang`, `.fid-burger`, `::selection`, `:focus-visible`, `summary`, `.hero-copy`, responsive nav media queries, reduced-motion). If a duplicate `.fx-eyebrow` already exists there, leave it — it is equivalent.

- [ ] **Step 3: Type-check, lint, build**

Run:
```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: all exit 0. `next build` route table prints as before.

- [ ] **Step 4: Visual smoke of the marketing page**

Run: `npm run dev` (background), then open `http://localhost:3000/`.
Expected: the marketing page looks the same as before (it already used these tokens; `--petrol-700` shifted `#405767 → #143a52` and `--surface-sunken` is newly defined). If anything visibly moved, add a `:root` override block **after** the token block pinning `--petrol-700: #405767;` and `--surface-sunken: #f3eee4;` and re-run Step 3. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "Adopt full Fluxio token set + Tailwind @theme in globals.css

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 2: Shared UI components

**Files:**
- Create: `src/components/ui/AuthCard.tsx`
- Create: `src/components/ui/Field.tsx`
- Create: `src/components/ui/StatCard.tsx`
- Create: `src/components/ui/StatusBadge.tsx`

**Interfaces:**
- Consumes: token utilities from Task 1; `DossierStatus` from `@/db/schema`.
- Produces:
  - `AuthCard({ title: string; subtitle?: string; footer?: React.ReactNode; children: React.ReactNode }): JSX.Element` — default export not used; named export `AuthCard`.
  - `Field(props: { id: string; label: string; type?: string; name?: string; value?: string; defaultValue?: string; placeholder?: string; autoComplete?: string; required?: boolean; disabled?: boolean; inputMode?: "text" | "numeric" | "email"; pattern?: string; maxLength?: number; autoFocus?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }): JSX.Element` — renders `<label htmlFor={id}>{label}</label>` then `<input id={id} name={name ?? id} …>`.
  - `FormAlert({ variant: "error" | "success"; children: React.ReactNode }): JSX.Element` — `role="alert"` for error, `role="status"` for success.
  - `StatCard({ label: string; value: string | number; hint?: string; accent?: boolean }): JSX.Element`.
  - `StatusBadge({ status: DossierStatus }): JSX.Element`; also `export const STATUS_LABELS: Record<DossierStatus, string>`.

- [ ] **Step 1: Create `src/components/ui/StatusBadge.tsx`**

```tsx
import type { DossierStatus } from "@/db/schema";

export const STATUS_LABELS: Record<DossierStatus, string> = {
  not_started: "Non commencé",
  submitted: "Soumis",
  in_review: "En cours de traitement",
  completed: "Terminé",
};

const STATUS_CLASS: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started-soft text-status-not-started",
  submitted: "bg-status-submitted-soft text-status-submitted",
  in_review: "bg-status-in-review-soft text-status-in-review",
  completed: "bg-status-completed-soft text-status-completed",
};

export function StatusBadge({ status }: { status: DossierStatus }) {
  const cls = STATUS_CLASS[status] ?? STATUS_CLASS.not_started;
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Field.tsx`**

```tsx
"use client";

import type { ChangeEvent } from "react";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: "text" | "numeric" | "email";
  pattern?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Field({ id, label, name, type = "text", ...rest }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        name={name ?? id}
        type={type}
        className="h-[50px] w-full rounded-xl border border-line-default bg-card px-4 text-[15px] text-strong outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
        {...rest}
      />
    </div>
  );
}

export function FormAlert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: React.ReactNode;
}) {
  const cls =
    variant === "error"
      ? "border-red-600/25 bg-red-100 text-red-600"
      : "border-green-600/25 bg-green-100 text-green-600";
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-5 ${cls}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/AuthCard.tsx`**

```tsx
import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" aria-hidden="true">
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
```

- [ ] **Step 4: Create `src/components/ui/StatCard.tsx`**

```tsx
export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-[18px] shadow-xs">
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <span
        className={`fx-figure text-[30px] font-extrabold ${accent ? "text-brand" : "text-strong"}`}
      >
        {value}
      </span>
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </div>
  );
}
```
(`font-mono` maps to `--font-mono` — confirm Tailwind resolves it; if not, use `style={{ fontFamily: "var(--font-mono)" }}`. `.fx-figure` is a global helper class.)

- [ ] **Step 5: Type-check, lint, build**

Run:
```bash
npx tsc --noEmit && npm run lint && npm run build
```
Expected: exit 0. Components are unused so far — that is fine.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui
git commit -m "Add ui/ components: AuthCard, Field/FormAlert, StatCard, StatusBadge

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 3: Auth screens onto Fluxio

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/signup/page.tsx`
- Modify: `src/app/(auth)/verify/page.tsx`
- Modify: `src/app/(auth)/forgot-password/page.tsx`
- Modify: `src/app/(auth)/reset-password/page.tsx`

**Interfaces:**
- Consumes: `AuthCard`, `Field`, `FormAlert` from `@/components/ui/*`; token utilities.
- Produces: nothing (leaf pages).

- [ ] **Step 1: Read every file in `src/app/(auth)/` and record invariants**

Run: `for f in src/app/\(auth\)/*.tsx src/app/\(auth\)/**/*.tsx; do echo "=== $f ==="; cat "$f"; done`

Write down, per page: the exact `<h1>` text, subtitle text, every `<label>` text, every input `id` / `placeholder` / `autoComplete` / `type`, every button label, and any `role="alert"` copy. These must survive verbatim.

- [ ] **Step 2: Reclass `(auth)/layout.tsx`**

Make the layout render a full-height `bg-surface` main with the `children` centred. It should NOT render `AuthCard` itself (each page does, so the login modal in sub-project 2 can reuse `AuthCard` without the layout). Minimal:

```tsx
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-surface px-4 py-12 sm:px-6">{children}</main>
  );
}
```
(If the current layout already does only this, just swap its bg class to `bg-surface`.)

- [ ] **Step 3: Rebuild each auth page body on `AuthCard` + `Field` + `FormAlert`**

For **each** of `login`, `signup`, `verify`, `forgot-password`, `reset-password`:
- Keep the `"use client"` directive, all hooks, all state, all `fetch()` calls, all `useRouter`/`useSearchParams` usage, the `verify` page's `<Suspense>` wrapper, and all handler logic **exactly**.
- Replace the hand-rolled `<main><div><Link>fiduvia</Link>…<section className="rounded-[20px]…">` chrome with `<AuthCard title="…" subtitle="…" footer={…}>`, passing the page's **existing** h1/subtitle/footer strings.
- Replace each `<label htmlFor>` + `<input>` pair with `<Field id="…" label="…" … />` using the **existing** `id`, label text, `placeholder`, `type`, `autoComplete`, `required`, and wiring `value`/`onChange` to the existing state. For the OTP input on `verify`, keep `inputMode="numeric"`, `pattern`, `maxLength={6}`, `autoFocus`, and `placeholder="000000"`.
- Replace each `{error && (<div role="alert" …>{error}</div>)}` with `{error && <FormAlert variant="error">{error}</FormAlert>}`; success/status messages with `<FormAlert variant="success">`.
- Replace the submit `<button>` with:
  ```tsx
  <button type="submit" disabled={loading}
    className="mt-6 flex h-[50px] w-full items-center justify-center rounded-xl bg-brand px-4 text-[14px] font-medium text-white transition-colors hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50">
    {loading ? "…existing loading label…" : "…existing button label…"}
  </button>
  ```
  Keep the **existing** button text and loading text.
- Any remaining hardcoded hex (`#F5F7F5`, `#17231D`, `#65796C`, `#536B5C`, `#7A847E`, `#8A938D`, `#E1E6E2`, `#ECEFEC`, `#F7F9F7`, `#EEF3EF`, `#D9DFDA`, `#C6CEC8`, `#F1C7C7`, `#FFF7F7`, `#A33A3A`, `#D5E4D8`, `#F2F7F3`, `#536B5C`) → nearest token utility:

  | old hex(es) | token utility |
  |---|---|
  | `#F5F7F5` bg | `bg-surface` |
  | `#17231D` / `#29342E` text | `text-strong` |
  | `#68736D` / `#7A847E` / `#737E77` text | `text-muted` |
  | `#8A938D` / `#9AA29D` / `#929A95` text | `text-subtle` |
  | `#65796C` / `#536B5C` / `#53615A` accent text | `text-brand` |
  | `#E1E6E2` / `#ECEFEC` / `#E0E5E1` / `#D9DFDA` border | `border-line` |
  | `#F7F9F7` / `#FAFBFA` bg | `bg-sunken` |
  | `#EEF3EF` icon-tile bg | `bg-teal-50` |
  | red alert (`#F1C7C7`/`#FFF7F7`/`#A33A3A`) | handled by `FormAlert` |
  | green status (`#D5E4D8`/`#F2F7F3`/`#536B5C`) | handled by `FormAlert` |
  | `bg-[#17231D]` / `bg-[#293B31]` button | `bg-brand` / `hover:bg-brand-hover` |

- [ ] **Step 4: Type-check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0.

- [ ] **Step 5: Run the E2E suite**

Ensure Docker is up: `docker compose up -d`. Then:
```bash
npm run test:e2e
```
Expected: **11 passed**. If `auth.spec.ts` fails on a locator, a string / `id` / `placeholder` changed — diff against Step 1's notes and restore it. (If OTP-issuance rate limiting trips `admin@fiduvia.test`, wait out the 15-min window — see the project memory note — and re-run.)

- [ ] **Step 6: Commit**

```bash
git add "src/app/(auth)"
git commit -m "Reskin auth screens onto Fluxio tokens + ui components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 4: Client portal onto Fluxio (recolour only)

**Files:**
- Modify: `src/app/portal/layout.tsx`
- Modify: `src/app/portal/page.tsx`
- Modify: `src/app/portal/error.tsx`
- Modify: `src/app/portal/DossierList.tsx`
- Modify: `src/app/portal/dossiers/[id]/page.tsx`
- Modify: `src/app/portal/dossiers/[id]/DossierDetail.tsx`

**Interfaces:**
- Consumes: `StatusBadge` (+ `STATUS_LABELS`), `FormAlert` from `@/components/ui/*`; token utilities.
- Produces: nothing.

- [ ] **Step 1: Read all six files; record every user-facing string**

Run: `cat src/app/portal/layout.tsx src/app/portal/page.tsx src/app/portal/error.tsx src/app/portal/DossierList.tsx src/app/portal/dossiers/\[id\]/page.tsx src/app/portal/dossiers/\[id\]/DossierDetail.tsx`

Invariants to preserve verbatim: `"Dossier {taxYear} — {STATUS_LABELS[status]}"` link text pattern in `DossierList`; `"Marquer comme soumis"`, `"Ajouter un document"`, `"Télécharger"`, `"Supprimer"`, `"Documents"`, `"Aucun document pour le moment."`, `"Chargement…"`, category labels, and all `setError(...)` strings in `DossierDetail`; `"Se déconnecter"` in `layout.tsx` / `page.tsx`; the nav labels `"Tableau de bord"` / `"Documents"` / `"Paiements"`.

- [ ] **Step 2: Recolour `portal/layout.tsx`**

Keep the structure (sticky top header, `PortalNavItem` horizontal nav, mobile nav row, avatar chip). Swap:
- `bg-[#F5F7F5]` → `bg-surface`; header `bg-white/95` → `bg-card/95`; `border-[#E1E6E2]` → `border-line`.
- brand `text-[#17231D]` → `text-strong`.
- nav item colours `text-[#68736D]` / hover `hover:bg-[#F2F5F2]` / `hover:text-[#17231D]` → `text-muted` / `hover:bg-sunken` / `hover:text-strong`.
- avatar chip `bg-[#17231D] text-white` → `bg-petrol-900 text-on-dark`; name/role greys → `text-strong` / `text-subtle`.

- [ ] **Step 3: Recolour `portal/page.tsx`**

Same hex→token mapping as Task 3 Step 3's table. The `PortalInfoCard` boxes: `border-[#E0E5E1] bg-white` → `border-line bg-card`, icon tile `bg-[#EEF3EF] text-[#536B5C]` → `bg-teal-50 text-brand`, text greys → `text-strong` / `text-muted` / `text-subtle`. The logout `<form action="/api/auth/logout" method="post">` and its button text unchanged; button border/hover → tokens.

- [ ] **Step 4: `DossierList.tsx` — use `StatusBadge`**

Import `STATUS_LABELS` is no longer needed here for the label map — but the current link text is `Dossier {taxYear} — {STATUS_LABELS[status]}`. Keep that exact text; import `STATUS_LABELS` from `@/components/ui/StatusBadge` and delete the local `STATUS_LABELS` const. Wrap the list container / heading in token classes (`text-strong`, `text-muted`). Do not restructure the `<ul>/<li>/<Link>`.

- [ ] **Step 5: `DossierDetail.tsx` — `StatusBadge` + `FormAlert`, recolour**

- Delete the local `CATEGORY_LABELS`? No — keep it (categories aren't in `StatusBadge`). Delete the local `STATUS_LABELS`; import from `@/components/ui/StatusBadge`. Where the status is shown (`Statut : {STATUS_LABELS[dossier.status]}`), keep that literal text, or optionally render `<StatusBadge status={dossier.status} />` next to it — keep the `"Statut : …"` text for the E2E `getByText("Soumis")` / `getByText("Terminé")` assertions to still match (the badge also contains that text, which is fine).
- Replace `{error && (<p role="alert" style={{ color: "red" }}>{error}</p>)}` with `{error && <FormAlert variant="error">{error}</FormAlert>}`.
- Replace `style={{ marginTop: 40 }}` and other inline styles with token classes.
- Buttons (`Marquer comme soumis`, `Télécharger`, `Supprimer`, upload `<input type="file">`, category `<select>`): keep text/behaviour; class them with `bg-brand` / `border-line` / `text-strong` etc. Keep `accept="application/pdf,image/jpeg,image/png"` and the `disabled={uploading}` wiring.

- [ ] **Step 6: `dossiers/[id]/page.tsx` and `portal/error.tsx` — recolour**

Hex→token swap only. `page.tsx` header/back-link/security card → tokens; keep all copy. `error.tsx` → `bg-surface` / `text-strong` / `bg-brand` button; keep the reset button text.

- [ ] **Step 7: Type-check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0.

- [ ] **Step 8: Run the E2E suite**

Run: `npm run test:e2e`
Expected: **11 passed**. `clientPortal.spec.ts` exercises this surface heavily (upload, download bytes round-trip, delete, submit, cross-client 404). If a `getByText` / `getByRole("button", { name })` fails, restore the exact string.

- [ ] **Step 9: Commit**

```bash
git add src/app/portal
git commit -m "Reskin client portal onto Fluxio tokens; use StatusBadge/FormAlert

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 5: `getAdminDashboardStats()` + tests

**Files:**
- Create: `src/lib/adminStats.ts`
- Create: `tests/unit/adminStats.test.ts`

**Interfaces:**
- Consumes: `db` from `@/db/client`; `dossiers`, `users` tables and `DossierStatus` from `@/db/schema`.
- Produces:
  ```ts
  export interface AdminDashboardStats {
    totalDossiers: number;
    completedDossiers: number;
    totalClients: number;
    byStatus: Record<DossierStatus, number>;
    byTaxYear: { taxYear: number; count: number }[];
  }
  export function getAdminDashboardStats(): Promise<AdminDashboardStats>;
  ```

- [ ] **Step 1: Look at how other `src/lib/*` files query**

Run: `cat src/lib/dossiers.ts src/db/client.ts` and `grep -rn "count(" src/ node_modules/drizzle-orm/sql/functions/aggregate.d.ts | head`
Note the Drizzle import style (`import { eq, and, desc, sql, count } from "drizzle-orm"`), and that the codebase tests against a real local Postgres (no mocks) — see `tests/unit/dossiers.test.ts`.

- [ ] **Step 2: Write the failing test**

`tests/unit/adminStats.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { users, dossiers } from "@/db/schema";
import { getAdminDashboardStats } from "@/lib/adminStats";

async function makeClient(): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      email: `stats-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "S",
      lastName: "T",
      role: "client",
    })
    .returning();
  return u.id;
}

describe("getAdminDashboardStats", () => {
  it("returns the same shape regardless of data (all 4 status keys, sorted years)", async () => {
    const stats = await getAdminDashboardStats();
    expect(Object.keys(stats.byStatus).sort()).toEqual(
      ["completed", "in_review", "not_started", "submitted"].sort(),
    );
    const years = stats.byTaxYear.map((r) => r.taxYear);
    expect([...years]).toEqual([...years].sort((a, b) => b - a));
    expect(stats.totalClients).toBeGreaterThanOrEqual(0);
  });

  it("counts newly-seeded dossiers and clients", async () => {
    const before = await getAdminDashboardStats();

    const c1 = await makeClient();
    const c2 = await makeClient();
    await db.insert(dossiers).values([
      { clientId: c1, taxYear: 2999, status: "completed" },
      { clientId: c1, taxYear: 2999, status: "in_review" },
      { clientId: c2, taxYear: 2998, status: "completed" },
    ]);

    const after = await getAdminDashboardStats();

    expect(after.totalDossiers).toBe(before.totalDossiers + 3);
    expect(after.completedDossiers).toBe(before.completedDossiers + 2);
    expect(after.totalClients).toBe(before.totalClients + 2);
    expect(after.byStatus.completed).toBe(before.byStatus.completed + 2);
    expect(after.byStatus.in_review).toBe(before.byStatus.in_review + 1);

    const y2999 = after.byTaxYear.find((r) => r.taxYear === 2999);
    expect(y2999?.count).toBe(2);
  });
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `npx vitest run tests/unit/adminStats.test.ts`
Expected: FAIL — `Cannot find module '@/lib/adminStats'` (or "getAdminDashboardStats is not a function").

- [ ] **Step 4: Implement `src/lib/adminStats.ts`**

```ts
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { dossiers, users, type DossierStatus } from "@/db/schema";

export interface AdminDashboardStats {
  totalDossiers: number;
  completedDossiers: number;
  totalClients: number;
  byStatus: Record<DossierStatus, number>;
  byTaxYear: { taxYear: number; count: number }[];
}

const ALL_STATUSES: DossierStatus[] = [
  "not_started",
  "submitted",
  "in_review",
  "completed",
];

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [[{ value: totalDossiers }], statusRows, [{ value: totalClients }], yearRows] =
    await Promise.all([
      db.select({ value: count() }).from(dossiers),
      db
        .select({ status: dossiers.status, value: count() })
        .from(dossiers)
        .groupBy(dossiers.status),
      db
        .select({ value: count() })
        .from(users)
        .where(and(eq(users.role, "client"), isNull(users.disabledAt))),
      db
        .select({ taxYear: dossiers.taxYear, value: count() })
        .from(dossiers)
        .groupBy(dossiers.taxYear)
        .orderBy(sql`${dossiers.taxYear} desc`),
    ]);

  const byStatus = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, 0]),
  ) as Record<DossierStatus, number>;
  for (const r of statusRows) byStatus[r.status] = Number(r.value);

  return {
    totalDossiers: Number(totalDossiers),
    completedDossiers: byStatus.completed,
    totalClients: Number(totalClients),
    byStatus,
    byTaxYear: yearRows.map((r) => ({
      taxYear: r.taxYear,
      count: Number(r.value),
    })),
  };
}
```

- [ ] **Step 5: Run the test, verify it passes**

Run: `npx vitest run tests/unit/adminStats.test.ts`
Expected: **2 passed**.

- [ ] **Step 6: Full unit suite + gates**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: `101 passed` (99 existing + 2 new), tsc/lint exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/lib/adminStats.ts tests/unit/adminStats.test.ts
git commit -m "Add getAdminDashboardStats() read-only aggregates + tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 6: Admin dark-sidebar shell

**Files:**
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: token utilities; `getCurrentUser` / `requireRole` from `@/lib/auth/guards` (already imported).
- Produces: the `.disp` page-title slot and dark shell that Task 7's `admin/page.tsx` renders into.

- [ ] **Step 1: Read the current layout and `Fiduvia.dc.html`'s admin shell**

Run: `cat src/app/admin/layout.tsx` and `grep -n "fid-side\|fid-shell\|fid-topbar\|ADMIN\|petrol-900" "Fiduciaire (4)/Fiduvia.dc.html" | head -60`
The mockup's shell: 244px `--petrol-900` sidebar, gold bar + `--font-mark` "FIDUVIA" + mono "ADMIN" pill, nav rows with a 7px status dot, `--font-mono` role label, sticky blurred top bar.

- [ ] **Step 2: Rewrite `admin/layout.tsx`**

Keep `await requireRole(["admin", "super_admin"])` and `getCurrentUser()` for the footer name. New structure:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/dossiers", label: "Dossiers" },
] as const;

const SOON = ["Clients", "Documents", "Notifications", "Paramètres"] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
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
```

Note: active-route highlighting needs `usePathname` (client). To keep the layout a server component, leave nav items in their default state (the mockup's active style is nice-to-have, not required). If active state is wanted, extract `<AdminNav />` as a `"use client"` component in `src/components/ui/` — optional, not blocking.

- [ ] **Step 3: Type-check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0.

- [ ] **Step 4: E2E**

Run: `npm run test:e2e`
Expected: **11 passed** — `auth.spec.ts`'s "admin login reaches the admin dashboard" navigates to `/admin` and asserts the URL, which is unaffected by the shell markup.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "Redesign admin shell: dark petrol left sidebar (Fluxio)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 7: Admin dashboard with real data

**Files:**
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `getAdminDashboardStats` from `@/lib/adminStats`; `StatCard` from `@/components/ui/StatCard`; `STATUS_LABELS` from `@/components/ui/StatusBadge`; `getCurrentUser` from `@/lib/auth/guards`; token utilities.
- Produces: nothing.

- [ ] **Step 1: Read the current dashboard**

Run: `cat src/app/admin/page.tsx`
Note it is a Server Component using `getCurrentUser()`. Keep the greeting; drop the local `StatCard` / `DashboardAction` helpers and the 4 placeholder cards / "Activité récente" empty state.

- [ ] **Step 2: Rewrite `admin/page.tsx`**

```tsx
import { getCurrentUser } from "@/lib/auth/guards";
import { getAdminDashboardStats } from "@/lib/adminStats";
import { StatCard } from "@/components/ui/StatCard";
import { STATUS_LABELS } from "@/components/ui/StatusBadge";
import type { DossierStatus } from "@/db/schema";

const STATUS_ORDER: DossierStatus[] = [
  "not_started",
  "submitted",
  "in_review",
  "completed",
];
const STATUS_BAR: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started",
  submitted: "bg-status-submitted",
  in_review: "bg-status-in-review",
  completed: "bg-status-completed",
};

export default async function AdminHomePage() {
  const [user, stats] = await Promise.all([
    getCurrentUser(),
    getAdminDashboardStats(),
  ]);
  const firstName = user?.firstName || "Administrateur";
  const currentYear = stats.byTaxYear[0]?.taxYear ?? new Date().getFullYear() - 1;
  const statusTotal = STATUS_ORDER.reduce((a, s) => a + stats.byStatus[s], 0);
  const maxYear = Math.max(1, ...stats.byTaxYear.map((r) => r.count));

  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="fx-eyebrow">Tableau de bord</p>
            <h1 className="disp mt-2 text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
              Bonjour, {firstName}
            </h1>
            <p className="mt-1.5 text-[15px] text-muted">
              Voici un aperçu de votre activité Fiduvia.
            </p>
          </div>
          <span className="rounded-full border border-line-default bg-card px-4 py-2 font-mono text-[12px] text-strong">
            Période {currentYear}
          </span>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="DOSSIERS" value={stats.totalDossiers} hint="tous statuts confondus" />
          <StatCard label="DOSSIERS TERMINÉS" value={stats.completedDossiers} hint="clôturés" />
          <StatCard label="CLIENTS" value={stats.totalClients} hint="comptes actifs" accent />
        </section>

        <section className="mt-4 rounded-xl border border-line bg-card p-[18px] shadow-xs">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            Répartition par statut
          </span>
          <div className="mt-3 flex h-[18px] gap-1 overflow-hidden rounded-full">
            {statusTotal === 0 ? (
              <div className="h-full w-full rounded-full bg-sunken" />
            ) : (
              STATUS_ORDER.filter((s) => stats.byStatus[s] > 0).map((s) => (
                <div
                  key={s}
                  className={`h-full ${STATUS_BAR[s]}`}
                  style={{ width: `${(stats.byStatus[s] / statusTotal) * 100}%` }}
                />
              ))
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {STATUS_ORDER.map((s) => (
              <span key={s} className="flex items-center gap-2 text-[12px] text-muted">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_BAR[s]}`} />
                {STATUS_LABELS[s]}
                <span className="fx-figure font-semibold text-strong">
                  {stats.byStatus[s]}
                </span>
              </span>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-line bg-card p-5 shadow-xs">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            Dossiers par année fiscale
          </span>
          <div className="mt-3.5 flex flex-col gap-3">
            {stats.byTaxYear.length === 0 && (
              <p className="text-[13px] text-muted">Aucun dossier.</p>
            )}
            {stats.byTaxYear.map((r) => (
              <div key={r.taxYear} className="flex items-center gap-3">
                <span className="disp w-16 shrink-0 text-[15px] font-bold">
                  {r.taxYear}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(r.count / maxYear) * 100}%` }}
                  />
                </div>
                <span className="fx-figure w-7 text-right text-[16px] font-bold text-brand">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Type-check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0.

- [ ] **Step 4: E2E + manual**

Run: `npm run test:e2e` → **11 passed**.
Then `npm run dev`, log in as `admin@fiduvia.test`, visit `/admin`, confirm the three cards, status strip, and per-year bars render with real numbers (create a dossier via `/admin/dossiers` if the DB is empty). Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "Admin dashboard: real dossier/client stats, status strip, year bars

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 8: Admin dossiers form + error boundary

**Files:**
- Modify: `src/app/admin/dossiers/page.tsx`
- Modify: `src/app/admin/error.tsx`

**Interfaces:**
- Consumes: `Field`, `FormAlert` from `@/components/ui/*`; token utilities. (`StatusBadge` only if the page renders a status — it renders a `<select>` of status *options*, so `StatusBadge` is optional here.)
- Produces: nothing.

- [ ] **Step 1: Read both files**

Run: `cat src/app/admin/dossiers/page.tsx src/app/admin/error.tsx`
Invariants: the `statusOptions` labels (`"Non commencé"` / `"Soumis"` / `"En cours de traitement"` / `"Terminé"`), button text `"Créer le dossier"` / `"Mettre à jour le statut"`, all `setCreateError` / `setStatusError` / `setCreateMessage` strings, the input `id`s (`clientId`, `taxYear`, `statusDossierId`, `status`), and the `role="alert"` / `role="status"` divs.

- [ ] **Step 2: Recolour `admin/dossiers/page.tsx`**

Keep `"use client"`, all state, all `fetch()` calls, all handlers. Structure stays (header, breadcrumb, two cards: create + status). Swap:
- The `<main className="min-h-screen bg-[#F5F7F5] text-[#17231D]">` → `bg-surface text-body`. This page renders its *own* header (`fiduvia` link + "Administration / Gestion des dossiers") — it sits inside the new dark shell, so **remove this page's inner `<header>`** and let the shell's top bar show; keep the breadcrumb link back to `/admin`.
- Card boxes `border-[#E0E5E1] bg-white shadow-[…]` → `border-line bg-card shadow-xs`.
- Replace the two `<label htmlFor> + <input>` pairs and their wrappers with `<Field id="clientId" label="Identifiant du client" … />` and `<Field id="taxYear" label="Année fiscale" type="number" … />` (keep `min="2000" max="2100"`, `placeholder`s, `value`/`onChange`). The `<select id="status">` stays a raw `<select>` (not `Field`) — just token its classes.
- Replace the `role="alert"` / `role="status"` divs with `<FormAlert variant="error">` / `<FormAlert variant="success">`.
- Buttons: `bg-[#17231D] hover:bg-[#293B31]` → `bg-brand hover:bg-brand-hover`; the outline button → `border-line-default text-strong hover:bg-sunken`.
- Any leftover greys → the Task 3 mapping table tokens.

- [ ] **Step 3: Recolour `admin/error.tsx`**

Hex→token swap; keep the reset-button text and `reset()` wiring.

- [ ] **Step 4: Type-check, lint, build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: exit 0.

- [ ] **Step 5: Full E2E + full unit suite**

Run: `npm test && npm run test:e2e`
Expected: `101 passed` (unit), `11 passed` (e2e).

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/dossiers/page.tsx src/app/admin/error.tsx
git commit -m "Reskin admin dossiers form + error boundary onto Fluxio tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014ENErwqPjtmra3xb1earba"
```

---

## Task 9: Final verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full gate**

Run:
```bash
npx tsc --noEmit && npm run lint && npm test && npm run build && npm run test:e2e
```
Expected: tsc 0, lint 0 errors, `101 passed`, build 0, `11 passed`.

- [ ] **Step 2: No stray hardcoded palette left**

Run:
```bash
grep -rnE "#[0-9A-Fa-f]{6}" src/app/'(auth)' src/app/portal src/app/admin src/components || echo "clean"
```
Expected: `clean` (all colour now flows through tokens). SVG `stroke="currentColor"` and `fill="none"` are fine; a literal hex is a miss — fix and re-commit into the relevant task's commit or a follow-up.

- [ ] **Step 3: Confirm the old `STATUS_LABELS` copies are gone**

Run: `grep -rn "STATUS_LABELS" src/app`
Expected: only *imports* from `@/components/ui/StatusBadge` — no local `const STATUS_LABELS = {` definitions in `DossierList.tsx` / `DossierDetail.tsx` / `admin/dossiers/page.tsx`.

- [ ] **Step 4: Manual responsive sweep**

`npm run dev`; at 1280px and 375px check: marketing (unchanged), all 5 auth screens, `/portal` + a dossier detail, `/admin` (sidebar → bottom bar on mobile), `/admin/dossiers`. Stop the dev server.

- [ ] **Step 5: Update the project memory note**

Append to `/Users/macbookair/.claude/projects/-Users-macbookair-Work-Web-Devlopment-Fiduciaire/memory/project_fiduvia_status.md` (or a new memory file): SP-1 (Fluxio reskin) done on branch `fluxio-reskin`; auth/portal/admin now on `@theme` tokens; admin has a dark shell + real-data dashboard; SP-2 (login modal) and SP-3 (i18n) still pending. Add the `MEMORY.md` pointer line.

---

## Self-Review

**Spec coverage:**
- Token layer (spec §1) → Task 1. ✓
- Shared components (spec §2) → Task 2. ✓
- Auth screens (spec §3) → Task 3. ✓
- Client portal recolour (spec §4) → Task 4. ✓
- Admin shell (spec §5) → Task 6. ✓
- `adminStats.ts` + admin dashboard (spec §5) → Tasks 5 + 7. ✓
- `admin/dossiers` + `admin/error` (spec §5) → Task 8. ✓
- Data flow (spec §6) → Task 5 (query) + Task 7 (consumption). ✓
- Error handling (spec) → `FormAlert` in Tasks 3/4/8; `StatusBadge` fallback in Task 2; `adminStats` propagates to `admin/error.tsx` (no new try/catch). ✓
- Testing (spec) → `adminStats.test.ts` in Task 5; E2E gates in Tasks 3/4/6/7/8; static gates every task; Task 9 final pass. ✓
- Rollout order (spec) → Tasks 1→8 match the spec's commit order (adminStats pulled to Task 5, before the admin shell that has no dependency on it, and before Task 7 that does). ✓
- Risks (spec): marketing drift → Task 1 Step 4; mobile bottom-bar → Task 6 note; `STATUS_LABELS` divergence → Task 9 Step 3; empty-DB test → `adminStats.test.ts` seeds its own rows. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to". The page-reskin tasks give an explicit hex→token mapping table + named structural edits + preserved-string lists rather than full re-listed JSX (the files are 100–400 lines and already in the repo; the mapping *is* the actionable content). Full code is given where it's created new (components, `adminStats.ts`, `admin/layout.tsx`, `admin/page.tsx`) or must be exact (`globals.css`).

**Type consistency:** `getAdminDashboardStats(): Promise<AdminDashboardStats>` — same name/shape in Task 5 interface, Task 5 impl, Task 7 consumption. `AdminDashboardStats` fields (`totalDossiers`, `completedDossiers`, `totalClients`, `byStatus`, `byTaxYear`) match between test, impl, and dashboard. `STATUS_LABELS` exported from `StatusBadge.tsx` (Task 2), imported in Tasks 4 and 7. `Field` / `FormAlert` prop shapes match between Task 2 definition and Tasks 3/4/8 usage. `StatCard` props (`label`, `value`, `hint`, `accent`) match Task 2 and Task 7.
