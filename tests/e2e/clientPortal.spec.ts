import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { getLatestOtpForEmail } from "./helpers/mailhog";
import { db } from "../../src/db/client";
import { users } from "../../src/db/schema";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.test`;
}

async function loginAsNewClient(page: Page, request: APIRequestContext, prefix: string) {
  const email = uniqueEmail(prefix);
  await request.post("/api/auth/signup", {
    data: {
      email,
      password: "a-long-enough-password",
      firstName: "A",
      lastName: "B",
      acceptTerms: true,
    },
  });
  await getLatestOtpForEmail(email); // drain the signup OTP email first

  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Vérifier le code" }).click();
  await page.waitForURL("/portal");
  return email;
}

// Test-orchestration only, not a feature under test: the app deliberately
// has no endpoint that resolves an email to a user id (that would be an
// enumeration oracle), so driving a real admin flow — which acts on a
// client's id, not their email — needs this to set up the scenario. Every
// actual dossier/document/status operation below goes through the real
// HTTP API, matching every other E2E test in this suite.
async function getUserIdByEmail(email: string): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user.id;
}

async function loginAsAdmin(context: { request: APIRequestContext }) {
  const email = "admin@fiduvia.test"; // seeded by `npm run seed:admin`, see tests/e2e/auth.spec.ts
  await context.request.post("/api/auth/login", {
    data: { email, password: "a-long-enough-password" },
  });
  const code = await getLatestOtpForEmail(email);
  await context.request.post("/api/auth/verify-otp", {
    data: { email, code, purpose: "login" },
  });
}

const SAMPLE_PDF = path.join(__dirname, "fixtures", "sample.pdf");

// Shared across every test in this file: admin OTP issuance is capped at
// 5 per rolling 15 minutes by the real rate limiter
// (src/lib/auth/rateLimit.ts), and each admin login consumes one. Logging
// in once here instead of once per test keeps this file's usage at 1
// issuance instead of 4, leaving headroom for auth.spec.ts's own admin
// test in the same run. Safe because playwright.config.ts sets
// fullyParallel: false, so tests in this file run sequentially.
let adminContext: BrowserContext;

test.beforeAll(async ({ browser }) => {
  adminContext = await browser.newContext();
  await loginAsAdmin(adminContext);
});

test.afterAll(async () => {
  await adminContext.close();
});

test("admin creates a dossier, client uploads and submits, admin reviews and completes it", async ({
  page,
  request,
}) => {
  const clientEmail = await loginAsNewClient(page, request, "e2e-portal-client");
  const clientId = await getUserIdByEmail(clientEmail);

  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId, taxYear: 2025 },
  });
  expect(createRes.ok()).toBe(true);
  const { dossier } = await createRes.json();

  // The home shows the declaration for the selected period; pin the period so
  // the assertion does not depend on which year the picker defaults to.
  await page.goto(`/portal?periode=${dossier.taxYear}`);
  await expect(
    page.getByText(`Ma déclaration d'impôts ${dossier.taxYear}`),
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("link", { name: /Ouvrir ma déclaration/ }).click();
  await page.waitForURL(new RegExp(`/portal/dossiers/${dossier.id}`));

  // A declaration opens the seven-page questionnaire. Jump to the last page,
  // where the required documents are listed and the return is submitted.
  await page.getByRole("button", { name: /Transmission documents/ }).click();
  await expect(
    page.getByRole("heading", { name: "Toutes vos pièces justificatives" }),
  ).toBeVisible({ timeout: 10_000 });

  // With no answers given, five pieces are always required.
  const inputs = page.locator('input[type="file"]');
  const required = await inputs.count();
  expect(required).toBeGreaterThan(0);

  // Submission is refused until every requested document is provided.
  const submit = page.getByRole("button", { name: "Transmettre ma déclaration" });
  await expect(submit).toBeDisabled();

  for (let i = 0; i < required; i += 1) {
    await inputs.nth(i).setInputFiles(SAMPLE_PDF);
    await expect(
      page.getByText(`${i + 1} / ${required} documents transmis`),
    ).toBeVisible({ timeout: 15_000 });
  }

  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText(/transmise à notre équipe/)).toBeVisible({
    timeout: 10_000,
  });

  const reviewRes = await adminContext.request.patch(`/api/dossiers/${dossier.id}/status`, {
    data: { status: "in_review" },
  });
  expect(reviewRes.ok()).toBe(true);
  const completeRes = await adminContext.request.patch(`/api/dossiers/${dossier.id}/status`, {
    data: { status: "completed" },
  });
  expect(completeRes.ok()).toBe(true);

  await page.reload();
  await expect(page.getByText(/transmise à notre équipe/)).toBeVisible();
});

test("a client cannot see another client's dossier", async ({ page, request, browser }) => {
  const ownerEmail = await loginAsNewClient(page, request, "e2e-portal-owner");
  const ownerId = await getUserIdByEmail(ownerEmail);

  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId: ownerId, taxYear: 2025 },
  });
  const { dossier } = await createRes.json();

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await loginAsNewClient(otherPage, otherContext.request, "e2e-portal-other");

  const res = await otherContext.request.get(`/api/dossiers/${dossier.id}`);
  expect(res.status()).toBe(404);
  await otherContext.close();
});

test("downloading a document from a dossier returns the exact bytes that were uploaded", async ({
  page,
  request,
}) => {
  const clientEmail = await loginAsNewClient(page, request, "e2e-portal-download");
  const clientId = await getUserIdByEmail(clientEmail);

  // A capital request rather than a declaration: this test is about document
  // mechanics, and a declaration now opens the seven-page questionnaire whose
  // uploads are covered separately.
  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId, taxYear: 2025, serviceType: "capital" },
  });
  const { dossier } = await createRes.json();

  await page.goto(`/portal/dossiers/${dossier.id}`);
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Télécharger" }).click(),
  ]);
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  const downloadedBytes = fs.readFileSync(downloadedPath!);
  const originalBytes = fs.readFileSync(SAMPLE_PDF);
  expect(downloadedBytes.equals(originalBytes)).toBe(true);
});

test("deleting a document removes it from the dossier's list", async ({
  page,
  request,
}) => {
  const clientEmail = await loginAsNewClient(page, request, "e2e-portal-delete");
  const clientId = await getUserIdByEmail(clientEmail);

  // A capital request rather than a declaration: this test is about document
  // mechanics, and a declaration now opens the seven-page questionnaire whose
  // uploads are covered separately.
  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId, taxYear: 2025, serviceType: "capital" },
  });
  const { dossier } = await createRes.json();

  await page.goto(`/portal/dossiers/${dossier.id}`);
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("sample.pdf")).not.toBeVisible();
});

test("a client opens a prestation request and the admin sees it under that prestation", async ({
  page,
  request,
}) => {
  // A period the firm has opened, so the request form has a year to offer.
  const year = 2090 + Math.floor(Math.random() * 10);
  await adminContext.request.post("/api/tax-periods", { data: { year } });
  await adminContext.request.patch("/api/tax-periods", {
    data: { year, isActive: true },
  });

  const email = await loginAsNewClient(page, request, "e2e-prestation");

  // Every prestation in the sidebar is reachable, not a greyed "bientôt".
  await page.getByRole("link", { name: "Prestation en capital" }).click();
  await page.waitForURL("**/portal/prestations/capital");
  await expect(
    page.getByRole("heading", { name: "Prestation en capital" }),
  ).toBeVisible();

  await page.getByLabel("Année fiscale").selectOption(String(year));
  await page.getByRole("button", { name: /Nouvelle demande/ }).click();

  // Opening a request lands on the dossier, named for its prestation rather
  // than as a tax declaration.
  await page.waitForURL(/\/portal\/dossiers\//);
  await expect(
    page.getByRole("heading", { name: "Prestation en capital", exact: true }),
  ).toBeVisible();

  // The same request shows up under the admin's capital table, and not under
  // declarations.
  const capital = await adminContext.newPage();
  await capital.goto(`/admin/dossiers/capital?periode=${year}`);
  await expect(capital.getByText(email)).toBeVisible();

  await capital.goto(`/admin/dossiers/declarations?periode=${year}`);
  await expect(capital.getByText(email)).toHaveCount(0);
  await capital.close();
});
