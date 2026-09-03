# Status check against the client brief — 2026-09-04

Baseline: `main` @ `c72aec8`, clean tree, fully pushed to `origin`.
Compare with `2026-09-03-client-requirements-gap.md`, whose findings are
carried forward here with their outcome.

Gate on this commit: `tsc` clean · lint 0 errors, 6 pre-existing warnings ·
141 unit tests · `build` OK (`/fr` and `/en` prerendered) · 11 E2E.

## 1. The brief, requirement by requirement

| # | Requirement | 2026-09-03 | Now |
|---|---|---|---|
| 1 | Client accounts + secure personal area | done | **done** |
| 2 | 2FA by email code | done | **done** |
| 3 | Clients submit files | done | **done** |
| 3b | …with payment at that stage | missing | **still missing** — no Stripe code anywhere |
| 4 | Swiss servers, scalable | architected | **architected, not provisioned** |
| 5 | Automatic admin-triggered email | missing | **still missing** — `sendEmail` has 4 call sites: signup, login, forgot-password, and the new contact form. None is admin-triggered |
| 6 | Admin dashboard: clients, files, documents | partial | **done** — 5 live sections (Accueil, Dossiers hub → table, Statistiques, Périodes, Utilisateurs) |
| 7 | Fix mockup bugs | partial | **mostly done** — see §2 |
| 8 | French SEO | missing | **partial** — per-locale metadata, canonical, hreflang and OpenGraph exist; **no sitemap, robots or JSON-LD** |
| 8b | Performance | at risk | **fixed** — 9 indexes (migration 0005). Session lookup `Seq Scan` (cost 69.29) → `Index Scan` (cost 8.29); OTP rate-limit count is an `Index Only Scan`, 0 heap fetches |
| 8c | Security | one open hole | **fixed** — see §2 |
| 8d | UX | partial | **done** for the client + admin areas; marketing still has inert controls |

## 2. The 2026-09-03 defect list, resolved

| Sev | Defect | Outcome |
|---|---|---|
| High | FR/EN switch inert | **Fixed.** `/` French, `/en` English, `/fr` 307s to `/`; whole app translated, including API errors and transactional email |
| High | Presigned upload accepts any size/type | **Fixed** (`c72aec8`). `confirmUpload` reads real metadata, re-applies the allow-list and cap, persists the truth, deletes anything failing. Regression test reproduces the original exploit |
| Med | Dead `/portal/documents`, `/portal/payments` | **Fixed.** Nav rebuilt from the mockup; unimplemented entries are non-clickable |
| Med | No secondary indexes | **Fixed.** Migration 0005 |
| Low | Mobile burger inert | **Still open** — `(public)/[lang]/page.tsx`, no handler |
| Low | Footer legal links `href="#"` | **Still open** — 2 occurrences; no privacy/CGUV/cookies pages |
| Low | Price simulator non-functional | **Still open** — marketing is a server component; the radios and "Développer plus" have no handlers |
| Low | No `#contact` section on marketing | **Still open** on marketing. A Contacts page now exists *inside* the portal |
| Low | Malformed JSON → 500 | **Still open in 8 of 17 routes.** Verified live: `POST /api/auth/login` with `{not json` returns **500**. The 4 routes added since are guarded |
| Low | No `(client_id, tax_year)` uniqueness | **Still open, deliberately.** 27 duplicate groups in the dev DB would make the constraint fail. `listDossiersForClient` now orders by `createdAt` so the client home's pick is deterministic |

## 3. Demo parity

Both areas were walked against the live demo at fiduvia.ch and aligned.
What deliberately still differs, and why:

- **Canton**, **dossier reservation** (`Réservé par`, auto-distribution) and the
  **Express 48h** flag — not in the data model.
- **Status vocabulary** — the demo uses `Demande de pièces` / `Pièces reçues` /
  `Réclamation`; ours is `not_started` / `submitted` / `in_review` /
  `completed`. Different pipeline, not a translation.
- **Revenue KPIs** — shown as client counts, since payments do not exist.
- **Paiements**, **Fiduvia Assistance**, and the capital / simulation /
  acomptes / relecture modules plus the declaration questionnaire — outside the
  brief, or blocked on pricing.

## 4. Credential hygiene

`Fiduvia2002_` does not appear in tracked source. Only `.env.example` is
tracked. `camille@exemple.ch` appears twice, as fixture data in
`tests/unit/contactEmail.test.ts`, which is a demo address rather than a
credential. The demo accounts still need rotating before production.

## 5. What is actually left

Unblocked, in the order I would take them:

1. **Admin-triggered email notifications** — requirement 5, the last unbuilt
   brief item that needs nothing from the client. `users.locale` already makes
   them bilingual.
2. **Finish French SEO** — sitemap, robots, JSON-LD (`LocalBusiness`, `FAQPage`).
3. **Marketing polish** — working burger, live price simulator, legal pages,
   contact section.
4. **400 instead of 500** on malformed JSON in the 8 remaining routes.

Blocked on the client:

- **Stripe**: pricing model, keys, CHF/TWINT, and whether payment gates
  submission.
- **Status vocabulary** — now urgent, because inline status editing is built on
  ours.
- **Infomaniak**: bucket, credentials, instance, domain, TLS.
- **Legal text**: privacy policy, CGUV, cookie policy.
- **`dossiers` uniqueness**: needs a data clean-up decision.
