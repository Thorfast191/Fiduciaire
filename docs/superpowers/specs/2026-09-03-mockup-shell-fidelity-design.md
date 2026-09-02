# Client + admin UI fidelity to the client mockup — design

Date: 2026-09-03 · Branch: `mockup-shell-fidelity` · Base: `main` @ `a56155a`

## Problem

The client's complaint is a *structural* mismatch between the demo they signed off
(`fiduvia.ch`, source `Fiduvia.dc.html`) and the built app. It is not a colour or
spacing drift — the client portal's shell is a different layout entirely.

| | Built (`src/app/portal/layout.tsx`) | Mockup (`Fiduvia.dc.html:2815`, markup `:1460`) |
|---|---|---|
| Shell | Light 72px sticky top header | Dark 244px left sidebar, `--petrol-900`, sticky, `100vh` |
| Brand | lowercase `fiduvia`, `-0.05em` | Gold 2×28px bar + `--font-mark` `FIDUVIA` 24px/500/`.1em` |
| Nav | 3 flat horizontal links | Grouped (`PRESTATIONS`/`DIVERS`) with mono heads + 7px dots |
| Account | Static avatar, top right | Bottom chip + popup (Profil / Déconnexion) |
| Title | none | Separate light topbar: `.disp` 700/20px + period pill |

The mockup uses **one shell for both client and admin**. The admin half of it
already exists (SP-1). So the work is mostly extraction plus application.

## Scope

In: the shared shell, both navs, the client home, the admin dashboard, the admin
dossiers list.

Out: the mockup's fictional modules (capital, simulation, acomptes, relecture,
décès, départ, arrivée, taxation office, estimator) — these are absent from the
client brief and have no backend. They appear as greyed non-clickable nav entries
tagged "bientôt", the treatment admin already uses. Also out: the marketing page.

## Section 1 — Shared shell (`src/components/shell/`)

All values below are transcribed from the mockup, not chosen.

- **`AppShell`** — `display:flex; min-height:100vh; background:var(--surface-page)`.
- **`SideNav`** — `width:244px; flex-shrink:0; background:var(--petrol-900);
  color:var(--text-on-dark); flex-column; padding:22px 16px; position:sticky;
  top:0; height:100vh; align-self:flex-start; overflow-y:auto`.
  - Brand block: `padding:4px 8px 24px`, gap 9px. Gold bar `width:2px`,
    height 28px (client) / 24px (admin), `border-radius:1px`. Wordmark
    `var(--font-mark)`, weight 500, 24px (client) / 21px (admin), `#fff`,
    `letter-spacing:.1em`; the `IDUVIA` span is `.76em` / `.13em`.
    Admin adds an `ADMIN` pill: mono 8px, `var(--teal-300)`,
    `1px solid var(--petrol-600)`, `padding:2px 6px`, `radius:99px`.
  - Nav list: flex column, `gap:3px`.
  - Section head: mono 9.5px, `letter-spacing:.14em`, uppercase, weight 600,
    `var(--neutral-500)`; padding `2px 12px 6px` first, else `18px 12px 6px`.
  - Item: flex, `gap:11px`, `padding:10px 12px`, `radius:8px`;
    active background `rgba(63,167,160,0.16)`, else transparent;
    dot 7px circle — active `var(--teal-400)`, else `var(--petrol-600)`;
    label `var(--font-text)` 14.5px, weight 600 active / 500, colour `#fff`
    active / `var(--neutral-400)`.
  - Mobile item padding is `13px 12px` with `min-height:44px`.
- **`AccountChip`** — `margin-top:auto`; row `padding:12px 10px`,
  `border-top:1px solid var(--border-ondark)`. Avatar 38px circle:
  client `var(--teal-500)`; admin `var(--petrol-800)` + `2px solid var(--petrol-600)`.
  Initial in `var(--font-display)` 700, 15px (client) / 14px (admin).
  Name `.disp` 700/15px `#fff`; tag mono 9px `var(--neutral-500)`
  `letter-spacing:.1em`; trailing `›` `var(--neutral-500)` 15px.
  Popup opens upward: `bottom:calc(100% + 6px)`, `#fff`,
  `1px solid var(--border-default)`, `radius:12px`,
  `box-shadow:0 20px 44px -18px rgba(11,32,48,.5)`, `padding:6px`.
- **`TopBar`** — flex, space-between, `gap:14px`, padding `14px 36px` (client) /
  `16px 36px` (admin), `border-bottom:1px solid var(--border-subtle)`,
  `background:rgba(250,247,240,.85)`, `backdrop-filter:saturate(180%) blur(8px)`,
  sticky, `z-index:10`. Left: mobile burger (42×42, `radius:10px`) then title
  `.disp` 700/20px. Right: mono 10px uppercase `.1em` period label.
- **`PeriodPicker`** — pill: inline-flex, `gap:8px`, weight 600/14px,
  `padding:9px 16px`, `radius:99px`, `var(--surface-card)`,
  `1px solid var(--border-default)`. Menu: absolute right 0,
  `top:calc(100% + 6px)`, `min-width:160px`, `radius:12px`,
  `box-shadow:0 20px 44px -18px rgba(11,32,48,.4)`, `padding:6px`;
  option active weight 700 `var(--brand)` on `var(--teal-100)`.

Content wrapper: `max-width:1240px; width:100%; padding:32px 36px 80px;
overflow-x:auto`.

## Section 2 — Nav content

Client (mockup grouping, `Fiduvia.dc.html:2826`):

```
PRESTATIONS
  Déclarations d'impôts        → /portal          live
  Prestation en capital                           bientôt
  Simulation d'impôts                             bientôt
  Détermination acomptes                          bientôt
  Relecture                                       bientôt
DIVERS
  Assistance                                      bientôt
  Paiements                                       bientôt
  Contacts                                        bientôt
```

Admin (`Fiduvia.dc.html:2952`):

```
Accueil        → /admin           live
Dossiers       → /admin/dossiers  live
Statistiques   → /admin/stats     live
Périodes                          bientôt
Utilisateurs                      bientôt
```

`Utilisateurs` stays a stub deliberately: "manage clients" is requirement 6 of the
client brief — real work with a backend, not a reskin. This removes the two dead
`/portal/documents` and `/portal/payments` links (audit §2, Med).

## Section 3 — Screens

**Client home** (`:1535-1592`). Greeting `h1` `.disp` 800,
`clamp(28px,3.4vw,34px)`, `line-height:1.05`; sub 15px `var(--text-muted)`.
Period pill right-aligned. Active-dossier card: `1px solid var(--border-subtle)`,
`var(--radius-lg)`, `padding:24px 26px`, `var(--surface-card)`,
`var(--shadow-md)`, flex `gap:24px`; eyebrow mono 10px uppercase, coloured
`var(--green-600)` when complete else `var(--brand)`; title `.disp` 700/24px;
progress bar 8px on `var(--surface-sunken)`, `radius:99px`. Below: help-docs
`1fr 1fr` grid (`min-height:112px`, 34px `var(--teal-100)` icon tile) at `flex:1.6`,
and a deadlines column at `flex:1`.

**Admin dashboard** — align to `:2895-2925`. KPI value → 30px/800 (revenue KPI
omitted; payments do not exist). Status strip → `height:18px`, `gap:5px`,
`radius:99px`, legend dots 9px. Prestation bars → 170px label, 12px track,
`radius:99px`, colours from `aPalette` = `[--brand, --petrol-800, --green-600,
--teal-500, --amber-600, --petrol-600]`.

**Admin dossiers list** — the mockup's row table (`:3049-3090`): card `#fff`,
`1px solid #E7EAEF`, `radius:16px`; header row `padding:12px 20px`, 12px/700,
`letter-spacing:.05em`, uppercase, `#9AA6B6`; data rows `padding:14px 20px`,
`border-bottom:1px solid #F2F4F7`, hover `#FAFBFD`, avatar + name/email stack.
Hex values are transcribed to their Fluxio token equivalents.

## Testing

The 11 Playwright E2E tests pin French strings, `getByLabel`, and
`getByRole("button", …)`. Every label, `id`, `htmlFor` and placeholder they touch
stays byte-identical; only layout and classes change. Full gate before merge:
`tsc`, `lint`, 101 unit tests, `build`, 11 E2E.
