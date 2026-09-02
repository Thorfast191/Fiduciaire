# Fiduvia — Fluxio Reskin (Sub-project 1 of 3)

Visual reconciliation of the app onto the **Fluxio** design system. First of a
three sub-project effort agreed during brainstorming:

1. **Fluxio reskin** (this spec) — palette/token migration + admin dashboard
   redesign. Pure visual + a few admin read queries. No auth/data-flow change.
2. **Login modal** — the two-step (password → OTP) login becomes a centred
   modal over the landing page; `/login` and `/verify` still resolve as URLs.
3. **App-wide i18n** — extract every FR string into `messages/{fr,en}.ts`,
   cookie + context + RSC helper, wire every page, working header FR/EN toggle,
   draft EN copy.

Each sub-project gets its own spec → plan → build → review cycle. This spec
covers sub-project 1 only.

## Context

The current app (Foundation + Document Storage + Client Portal, all merged to
`main`) has three visual layers that disagree:

- **Marketing** (`src/app/page.tsx`) already uses the Fluxio tokens via
  `var(--brand)`, `var(--petrol-900)`, `.fx-eyebrow`, etc. `globals.css` holds a
  **partial** copy of those tokens.
- **Auth + client portal + admin** hardcode a separate green-grey palette
  (`#F5F7F5`, `#17231D`, `#65796C`, `#536B5C`) and never touch the tokens.
- **Admin** is a light theme with a white sidebar; the design reference shows a
  dark petrol left-sidebar shell.

The authoritative design system is **Fluxio** (`Fiduciaire (4)/_ds/design-system-*`
and the Drive bundle `Fiduciaire (2).zip`): petrol + teal + warm sand, brand =
`--teal-600 #1B6E7E`. The Drive bundle also contains ~65 screenshots and
`Fiduvia.dc.html`; **most screenshots depict a much larger fictional product**
(capital-benefit / departure / death / simulation / instalment flows, estimator,
assistance, payments, admin reservation/distribution, period & user management)
and an older **blue** brand iteration. Those are out of scope. The canonical
visual language is teal/Fluxio; the reference screens that matter here are
`login.png` (modal — sub-project 2) and the dark admin shell in `Fiduvia.dc.html`.

**Scope decision (brainstorming):** reskin only what exists. Every mockup screen
for a non-existent feature is ignored.

## Goals

- One palette, sourced from the full Fluxio token set, exposed to Tailwind as
  semantic utilities.
- Auth screens, the client portal, and the admin section rendered on those
  tokens instead of hardcoded green-grey hex.
- The admin shell redesigned to the dark petrol left-sidebar layout, and the
  admin dashboard populated with **real** data (dossier counts, status
  breakdown, client count, dossiers by tax year) instead of `—` placeholders.
- Zero behaviour change: no auth, session, RBAC, route, or API change. The only
  new server-side code is read-only aggregate queries for the dashboard.
- The 11 Playwright E2E tests stay green (every user-facing string, `htmlFor`/`id`,
  and `placeholder` value is preserved byte-identical).

## Non-goals

- The login modal (sub-project 2) and i18n (sub-project 3).
- Any feature from the mockup that isn't already built (estimator, capital
  benefits, departure/death/simulation/instalment flows, assistance, payments,
  admin dossier browsing, notifications, period/user management).
- A generic component library. Only four small presentational components are
  extracted (below); buttons and plain card boxes stay as utility-class strings.
- Restructuring the client portal layout. It keeps its sticky-top-header +
  horizontal-nav structure, recoloured only (explicit brainstorming decision).
- Dark-mode / theme switching. Fluxio is a single committed light palette with a
  dark admin sidebar.

## Architecture

### 1. Token layer — `src/app/globals.css`

Replace the partial `:root` palette with the **complete Fluxio token set**,
copied inline (first-party source; no runtime dependency on the
`Fiduciaire (4)/` path):

- **Colour ramps:** `--petrol-{950,900,800,700,600}`, `--teal-{700,600,500,400,300,200,100,50}`,
  `--sand-{400,300,200,100}`, `--neutral-{0,50,100,200,300,400,500,600,700,800,900}`,
  `--green-{600,100}`, `--amber-{600,100}`, `--red-{600,100}`.
- **Semantic aliases:** `--text-{strong,body,muted,subtle,on-dark,on-teal,link}`,
  `--surface-{page,card,sunken,inverse,teal,cream}`,
  `--border-{subtle,default,strong,ondark}`,
  `--brand`, `--brand-hover`, `--brand-active`, `--brand-soft`, `--accent`,
  `--focus-ring`.
- **Type / spacing / radii / shadows / motion:** the token *variables* only
  from `tokens/typography.css` and `tokens/spacing.css` (`--font-*`, `--fw-*`,
  `--text-xs…5xl`, `--leading-*`, `--tracking-*`, `--space-0…10`,
  `--container-*`, `--gutter`, `--radius-{xs,sm,md,lg,xl,pill}`,
  `--shadow-{xs,sm,md,lg,teal}`, `--ease-*`, `--dur-*`). Do **not** copy
  `typography.css`'s `body` / `h1…h5` element rules (`globals.css` already has
  equivalent ones) and do **not** copy `tokens/fonts.css` — the three families
  stay loaded via `next/font` in `src/app/layout.tsx`, which already populates
  `--font-display` / `--font-text` / `--font-mono`.
- **Additions not in Fluxio:** `--gold: #c4a265` (marketing uses it), and four
  dossier-status pairs derived from `Fiduvia.dc.html`'s `statusMeta`:

  | status         | fg        | soft bg   |
  |----------------|-----------|-----------|
  | `not_started`  | `#8A93A1` | `#F0F2F6` |
  | `submitted`    | `#6B4FC0` | `#EFEAFB` |
  | `in_review`    | `#0E7C86` | `#DDF3F4` |
  | `completed`    | `#145863` | `#D9EFEC` |

  named `--status-<status>` / `--status-<status>-soft` (using the real schema's
  enum values, not the mockup's `encours`/`demande_piece`/… set).

- **`@theme` block** (Tailwind v4, already in use via `@tailwindcss/postcss`)
  maps the semantic layer and ramps to utilities:

  ```css
  @theme {
    --color-surface:        var(--surface-page);
    --color-card:           var(--surface-card);
    --color-sunken:         var(--surface-sunken);
    --color-inverse:        var(--surface-inverse);   /* petrol-800 */
    --color-strong:         var(--text-strong);
    --color-body:           var(--text-body);
    --color-muted:          var(--text-muted);
    --color-subtle:         var(--text-subtle);
    --color-on-dark:        var(--text-on-dark);
    --color-line:           var(--border-subtle);
    --color-line-default:   var(--border-default);
    --color-line-strong:    var(--border-strong);
    --color-line-ondark:    var(--border-ondark);
    --color-brand:          var(--brand);
    --color-brand-hover:    var(--brand-hover);
    --color-accent:         var(--accent);
    --color-gold:           var(--gold);
    --color-petrol-950 … --color-petrol-600: var(--petrol-*);
    --color-teal-50 … --color-teal-700:      var(--teal-*);
    --color-green-600 / --color-green-100 / --color-amber-* / --color-red-*;
    --color-status-not-started / -submitted / -in-review / -completed;
    --color-status-not-started-soft / … (4);
  }
  ```

  Generates `bg-surface`, `bg-card`, `bg-inverse`, `text-strong`, `border-line`,
  `bg-brand`, `bg-petrol-900`, `bg-teal-100`, `text-status-completed`,
  `bg-status-completed-soft`, `ring-brand`, etc.

- **Back-compat:** the Fluxio set is a **superset** of the current
  `globals.css` palette, so `page.tsx` and the `.fx-*` / `.disp` helpers keep
  working unchanged. Two legacy values shift (`--petrol-700`
  `#405767 → #143A52`; `--surface-sunken` newly defined). If the marketing page
  must not move at all, pin those two aliases to their prior values in a
  `:root` override block — decided at implementation time by eyeballing
  `next dev` before/after.

`.fx-eyebrow`, `.fx-figure` (Fluxio) and `.disp` (local) helper classes stay.

### 2. Shared components — `src/components/ui/` (new folder)

Presentational, no hooks → server components, usable from server or client
parents. Names mirror the Fluxio DS manifest.

| File | Export(s) | Purpose |
|---|---|---|
| `AuthCard.tsx` | `AuthCard` | Brand mark + `title` + `subtitle` + `children` + optional `footer` slot. Used by the `(auth)` pages now; sub-project 2's modal renders the same component so login/verify look identical in either context. No `×` here (that's the modal's). |
| `Field.tsx` | `Field`, `FormAlert` | `Field` renders `<label htmlFor={id}>{label}</label>` + `<input id={id} …>`, passing through `type`, `name`, `autoComplete`, `required`, `inputMode`, `pattern`, `maxLength`, `placeholder`, `value`, `onChange`, `disabled`. **Preserves the `getByLabel` E2E convention exactly.** `FormAlert` = the `role="alert"` / `role="status"` message box, variant `error | success`. |
| `StatCard.tsx` | `StatCard` | `label` (mono eyebrow) + `value` (`.fx-figure`) + `hint`. Optional `accent` to colour the value `text-brand`. |
| `StatusBadge.tsx` | `StatusBadge` | `status: DossierStatus` → FR label (`STATUS_LABELS` moved here as the single source) + `text-status-<s>` / `bg-status-<s>-soft` pill. Replaces the three hand-rolled copies in `DossierList`, `DossierDetail`, `admin/dossiers`. Sub-project 3 swaps the label map for `t()`. |

`Field`/`FormAlert` are client-safe (plain markup, callbacks passed in); the
existing `"use client"` pages import them normally.

### 3. Auth screens

- `src/app/(auth)/layout.tsx` renders the `AuthCard` chrome (Fiduvia brand link,
  `bg-surface` page, centred column, footer `© … Fiduvia` line) around
  `children`.
- `login/page.tsx`, `signup/page.tsx`, `verify/page.tsx`,
  `forgot-password/page.tsx`, `reset-password/page.tsx` each drop their
  duplicated chrome and render just their form using `Field` / `FormAlert` /
  a brand-filled submit button, on Fluxio tokens.
- **Preserved byte-identical:** every visible string, every `htmlFor`/`id`
  pair, every `placeholder` (`"vous@exemple.ch"`, `"000000"`, …), the submit
  button labels (`"Se connecter"`, `"Créer mon compte"`, `"Vérifier le code"`,
  `"Réinitialiser le mot de passe"`), and the `<Suspense>` boundary in
  `verify/page.tsx`.
- No client logic change — the `fetch()` calls, `useRouter` redirects, and
  error handling are untouched.

### 4. Client portal (recolour only)

Token swap, structure unchanged:

- `portal/layout.tsx` — sticky top header, `bg-card` on `border-line`,
  horizontal `PortalNavItem` nav, avatar chip → Fluxio tokens.
- `portal/page.tsx` — `PortalInfoCard`s and the security/account cards →
  `bg-card` / `border-line` / `text-*` tokens. (`PortalInfoCard` may optionally
  be replaced by `StatCard` if the shape matches; not required.)
- `portal/DossierList.tsx`, `portal/dossiers/[id]/DossierDetail.tsx` — use
  `StatusBadge`; `DossierDetail`'s inline `style={{ color: "red" }}` alert and
  `style={{ marginTop: 40 }}` → `FormAlert` + token classes.
- `portal/dossiers/[id]/page.tsx`, `portal/error.tsx` — token swap.
- All copy and the `input[type="file"]` / button names preserved (E2E:
  `"Marquer comme soumis"`, `"Télécharger"`, `"Supprimer"`, `"sample.pdf"`
  visibility, `"Soumis"` / `"Terminé"` text).

### 5. Admin shell + dashboard

**`admin/layout.tsx` → dark shell** (matches `Fiduvia.dc.html`'s `fid-shell` /
`fid-side`):

- 244px `bg-petrol-900` left sidebar, `text-on-dark`, sticky, full height.
- Brand block: 2px `bg-gold` bar + `font-mark` "F<small>IDUVIA</small>" +
  `font-mono` "ADMIN" pill (`border-petrol-600`, `text-teal-300`).
- Nav: **Tableau de bord** (`/admin`) and **Dossiers** (`/admin/dossiers`),
  active state = filled `bg-teal-400/16` row + `bg-teal-400` dot; inactive =
  `text-neutral-400` + `bg-petrol-600` dot. Then a "Système" group of
  **greyed, non-clickable** items — Clients, Documents, Notifications,
  Paramètres — each `text-petrol-600` with a small `bientôt` tag and
  `pointer-events:none`.
- Footer: account chip (avatar = initials on `bg-petrol-800`, name, role
  `SUPER ADMIN` / `ADMINISTRATEUR` in `font-mono`, `›`).
- Top bar: sticky, `bg-surface/85` + `backdrop-blur`, `border-line`, page
  title (`.disp`) + a **non-interactive** `font-mono` "Période {year}" chip,
  where `{year}` = the most recent `taxYear` present in `dossiers`
  (fallback: current calendar year − 1).
- Mobile (`max-width: 900px`): sidebar collapses to a fixed bottom bar with
  horizontal-scrolling nav (mirrors the mockup's media queries). The greyed
  items are hidden on mobile.
- `await requireRole(["admin", "super_admin"])` unchanged.
- Local `AdminNavItem` helper updated; may move to `src/components/ui/` if it
  grows, otherwise stays in the file.

**`admin/page.tsx` → real data.** New `src/lib/adminStats.ts`:

```ts
export async function getAdminDashboardStats(): Promise<{
  totalDossiers: number;
  completedDossiers: number;
  totalClients: number;                          // users role='client', not disabled
  byStatus: Record<DossierStatus, number>;       // 4 keys, always present
  byTaxYear: { taxYear: number; count: number }[]; // desc by taxYear
}>;
```

Implemented with Drizzle `count()` / `groupBy` against the existing tables
(`dossiers`, `users`). No new tables, no migration.

Dashboard render (Server Component, keeps `getCurrentUser()` for the greeting):

- H1 "Espace administrateur" + sub line.
- Three `StatCard`s: **Dossiers** (`totalDossiers`), **Dossiers terminés**
  (`completedDossiers`), **Clients** (`totalClients`). No revenue card —
  payments don't exist (sub-project 4).
- **"Répartition par statut"** — a `--radius-pill` horizontal strip split into
  4 `bg-status-*` segments proportional to `byStatus`, with a legend
  (`StatusBadge`-style dots + counts). Empty DB → a single `bg-sunken` track.
- **"Dossiers par année fiscale"** — one labelled horizontal bar per entry in
  `byTaxYear`, width proportional to the max, count on the right
  (`.fx-figure`). Empty → "Aucun dossier".

**`admin/dossiers/page.tsx`** — token swap + `Field` / `FormAlert` /
`StatusBadge`; the create-dossier and change-status forms keep their exact
behaviour, field ids, and toast copy. **`admin/error.tsx`** — token swap.

### 6. Data flow

Unchanged everywhere except the admin dashboard, which gains one server-side
call: `admin/page.tsx` → `getAdminDashboardStats()` → Drizzle aggregate reads
on `dossiers` / `users` → rendered counts. Read-only, no caching added, runs
per request like the rest of the app.

## Error handling

- `getAdminDashboardStats()` does plain awaited queries; a DB failure
  propagates to the existing `admin/error.tsx` boundary (now token-swapped).
  No new try/catch — matches the codebase's "unexpected failures hit the error
  boundary" convention.
- `StatusBadge` with an unknown status string falls back to the `not_started`
  styling and renders the raw value (defensive; shouldn't happen — column is a
  TS enum).
- No user-facing error paths are added or changed.

## Testing

- **Unit (Vitest, real local PG):** existing 99 tests untouched. Add
  `tests/unit/adminStats.test.ts` — seed a couple of clients + dossiers across
  statuses and tax years, assert `getAdminDashboardStats()` returns the right
  totals, `byStatus` has all 4 keys, `byTaxYear` is sorted desc, and an empty
  DB yields zeros / `[]`.
- **E2E (Playwright):** no test file changes expected. SP-1 preserves every
  string, `htmlFor`/`id`, and `placeholder`, so `auth.spec.ts` (7) and
  `clientPortal.spec.ts` (4) stay green. The "security headers / HSTS absent"
  test is unaffected (no header change). Run the full suite after the admin
  work as the gate.
- **Static gates** after each surface: `npx tsc --noEmit`, `npm run lint`
  (0 errors; warnings ok), `npm run build`.
- **Manual:** `next dev`, eyeball marketing (should be visually unchanged),
  each auth screen, `/portal` + a dossier, `/admin` + `/admin/dossiers`, at
  desktop and ~375px.

## Rollout

One branch (`fluxio-reskin`), reviewable commits in order:

1. `globals.css` token layer + `@theme`.
2. `src/components/ui/` — `AuthCard`, `Field`/`FormAlert`, `StatCard`,
   `StatusBadge`.
3. `(auth)` layout + 5 pages.
4. Client portal (6 files).
5. `admin/layout.tsx` dark shell.
6. `admin/page.tsx` + `src/lib/adminStats.ts` + `adminStats.test.ts`.
7. `admin/dossiers/page.tsx` + `admin/error.tsx`.

Each commit: `tsc` + `lint` + `build` green; steps 3–7 also run the E2E suite.

## Risks

- **Marketing drift.** The fuller token set nudges `--petrol-700` and adds
  `--surface-sunken`; `page.tsx` uses `--petrol-700` in a couple of places.
  Mitigation: compare `next dev` before/after; pin the two aliases if anything
  visibly moves.
- **Admin mobile bottom-bar** is the fiddliest piece; the mockup's media
  queries are the reference. If it fights the sticky top bar, fall back to a
  simple collapsible top drawer — still on-tokens, still usable.
- **`StatusBadge` label source.** Moving `STATUS_LABELS` into the component
  means three call sites now import it; a stale copy left behind would diverge.
  The plan must delete all three inline copies.
- **Empty-DB dashboard.** Local/CI DB may have data from prior test runs;
  `adminStats.test.ts` must seed its own rows and not assume a clean table
  (or clean up), matching the suite's existing pattern.

## Open questions

- Whether to pin `--petrol-700` / `--surface-sunken` to their old values to
  keep marketing pixel-stable — resolved at implementation time by visual diff,
  not blocking.
