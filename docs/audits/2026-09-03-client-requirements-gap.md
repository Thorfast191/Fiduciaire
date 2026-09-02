# Client-requirements gap audit — 2026-09-03

Baseline: `main` @ `a56155a`, clean tree. Source of truth = the client's freelance
brief (quoted per line below) + the client mockup `Fiduvia.dc.html` + the Fluxio
`_ds/` design system.

## 0. The headline finding: brief ≠ mockup

The two reference documents describe **different-sized products**, and this is the
root of the "structural difference" complaint.

The **brief** asks for 8 things: accounts + secure personal area, email 2FA,
file submission with payment at that step, Swiss-hosted storage, admin-triggered
email notifications, an admin dashboard for clients/files/documents, mockup bug
fixes, and optimisation (perf / security / UX / French SEO).

The **mockup** implements a product roughly 5× that size. Its own FR dictionary
(`Fiduvia.dc.html:4118-4687`) has ~450 keys covering flows the brief never
mentions: prestation en capital, départ à l'étranger, décès en cours d'année,
simulations d'impôts, détermination des acomptes, réservations, taxation-office
requests, a tax estimator, assistance plans, admin user management, admin period
management, and client-side PDF generation.

**Recommendation:** build to the brief. Treat the mockup as the *visual* and
*copy* source of truth, not the scope. Everything below is scoped to the brief.

## 1. Requirement-by-requirement status

| # | Brief requirement | Status | Evidence |
|---|---|---|---|
| 1 | Client account creation + secure personal area | **DONE** | `src/app/(auth)/signup`, `src/app/portal/*`, `src/proxy.ts` guards `/portal` + `/admin`, argon2id in `src/lib/auth/password.ts` |
| 2 | 2FA by email verification code | **DONE** | `src/lib/auth/otp.ts` — SHA-256-hashed 6-digit code, 10-min TTL, 5-attempt cap, mandatory on *every* login for *every* role; `src/lib/email/templates/otpEmail.ts` |
| 3 | Clients submit files through their account | **DONE** | `src/app/api/documents/*` presigned PUT → S3, `DossierDetail.tsx`, 6 fixed categories |
| 3b | …**with a payment method integrated at that stage** | **MISSING** | Zero payment code in the repo. `grep -ri stripe src/` → nothing. `/portal/payments` nav link is a 404 |
| 4 | Secure Swiss servers, scalable | **PARTIAL** | Architecture is correct and provider-agnostic (S3 API, `docs/deployment/foundation.md` targets Infomaniak, Geneva/Zurich). Not provisioned; no bucket, no credentials, no TLS/HSTS go-live |
| 5 | Automatic email notification from the admin area | **MISSING** | `sendEmail()` is called from exactly one place — OTP. Only one template exists |
| 6 | Admin dashboard: manage clients, files, documents | **PARTIAL** | Real stats page + dossier create/status form only (`src/app/admin/*`). No client list, no document browser, no per-client drill-down. Sidebar shows 4 greyed "bientôt" stubs |
| 7 | Fix bugs present in the mockup | **PARTIAL** | See §2 |
| 8 | Optimisation — French SEO | **MISSING** | `src/app/layout.tsx` is the entire SEO surface: one `title`, one `description`, `export const dynamic = "force-dynamic"`. No sitemap, robots, canonical, OpenGraph, JSON-LD, or per-page metadata |
| 8b | Optimisation — performance | **AT RISK** | No secondary DB indexes at all (`src/db/schema.ts` — PKs + 2 uniques only). `sessions.token_hash` is sequentially scanned on **every authenticated request**; `audit_log` is scanned on every login and OTP issuance and grows unbounded |
| 8c | Optimisation — security | **ONE OPEN HOLE** | Presigned PUT does not bind `Content-Length`/`Content-Type`; verified live — claimed `image/png`/5 bytes, uploaded 4096 bytes of `application/x-msdownload`, `confirm` returned 200 and listed the document with false metadata |
| 8d | Optimisation — UX | **PARTIAL** | Reskinned onto Fluxio tokens (SP-1, merged). Broken affordances remain — see §2 |

## 2. Live defects (the "mismatches")

| Sev | Defect | Location |
|---|---|---|
| **High** | **FR/EN switch is inert.** Two `<button type="button">` with no handler, no state, no dictionary. Zero i18n in the app | `src/app/page.tsx:155-171` |
| **High** | Presigned upload accepts arbitrary size/type; false metadata is persisted | `src/lib/documents.ts` `confirmUpload` |
| **Med** | Dead client nav: `/portal/documents` and `/portal/payments` both 404 | `src/app/portal/layout.tsx:34,36,65,67` |
| **Med** | No secondary indexes; `sessions.token_hash` seq-scan per request | `src/db/schema.ts` |
| **Low** | Mobile burger button is inert (no menu) | `src/app/page.tsx` |
| **Low** | Footer legal links are `href="#"`; no privacy / CGUV / cookies pages | `src/app/page.tsx:1200,1204` |
| **Low** | Price simulator in the hero is non-functional | `src/app/page.tsx` |
| **Low** | No `#contact` section; the mockup has one (`contactTitle`, `contactSendTitle`, `contactReachTitle`, …) | `src/app/page.tsx` |
| **Low** | Malformed JSON body → 500 instead of 400 (unguarded `await request.json()` in every route) | `src/app/api/**/route.ts` |
| **Low** | No `(client_id, tax_year)` uniqueness on `dossiers` | `src/db/schema.ts` |

## 3. Asset discovered: the client already wrote the EN copy

`Fiduvia.dc.html` carries a complete two-language dictionary:

- `const FR = { … }` — lines 4118-4687 (~450 keys)
- `const EN = Object.assign({}, FR, { … })` — lines 4689-5076 (~330 overrides)

This removes the biggest unknown from the i18n work: **we do not have to draft or
commission English copy**, and the client does not have to review a translation
they didn't write. We lift their strings verbatim for every screen that exists.

## 4. Build order

Unblocked, in dependency order:

1. **FR/EN language switch** (flagged twice by the client). Cookie-only, in-house,
   no URL locale, no new dependency. Copy lifted from the mockup dictionary.
2. **Security + performance fixes**: bind real object metadata on confirm; add the
   missing indexes; 400 on malformed JSON.
3. **Admin dashboard for real**: client list → client detail → their dossiers →
   their documents. Removes 4 of the "bientôt" stubs.
4. **Admin-triggered email notifications**: request supporting documents / notify
   action required, with templates + audit trail.
5. **Marketing completion**: working burger, contact section, legal pages, live
   price simulator.
6. **French SEO**: per-page metadata, sitemap, robots, canonical, OG, JSON-LD
   (`LocalBusiness` + `FAQPage`), and dropping `force-dynamic` on public routes.
7. **Login modal** (two-step password → OTP over the landing page) — polish, not
   a brief requirement; `AuthCard` is already built for it.

Blocked on client input:

- **Payments (Stripe)** — needs the pricing model (per-dossier? per-prestation?
  the mockup implies a base price + options), Stripe account + keys, CHF/TWINT
  decision, invoice + refund policy, and whether payment gates submission or
  merely accompanies it.
- **Infomaniak provisioning** — bucket, credentials, instance, domain, TLS.
- **Legal page text** — privacy policy, CGUV, cookie policy.
- **Production credentials** — the mockup's demo accounts
  (`contact@fiduvia.ch`, `camille@exemple.ch`) must not survive to production.
