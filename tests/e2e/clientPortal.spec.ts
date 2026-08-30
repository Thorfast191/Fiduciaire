import path from "node:path";
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
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
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });
  await getLatestOtpForEmail(email); // drain the signup OTP email first

  await page.goto("/login");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Valider" }).click();
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

test("admin creates a dossier, client uploads and submits, admin reviews and completes it", async ({
  page,
  request,
  browser,
}) => {
  const clientEmail = await loginAsNewClient(page, request, "e2e-portal-client");
  const clientId = await getUserIdByEmail(clientEmail);

  const adminContext = await browser.newContext();
  await loginAsAdmin(adminContext);

  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId, taxYear: 2025 },
  });
  expect(createRes.ok()).toBe(true);
  const { dossier } = await createRes.json();

  await page.goto("/portal");
  await expect(page.getByText(`Dossier ${dossier.taxYear}`)).toBeVisible({ timeout: 10_000 });
  await page.getByText(`Dossier ${dossier.taxYear}`).click();
  await page.waitForURL(new RegExp(`/portal/dossiers/${dossier.id}`));

  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Marquer comme soumis" }).click();
  await expect(page.getByText("Soumis")).toBeVisible();

  const reviewRes = await adminContext.request.patch(`/api/dossiers/${dossier.id}/status`, {
    data: { status: "in_review" },
  });
  expect(reviewRes.ok()).toBe(true);
  const completeRes = await adminContext.request.patch(`/api/dossiers/${dossier.id}/status`, {
    data: { status: "completed" },
  });
  expect(completeRes.ok()).toBe(true);

  await page.reload();
  await expect(page.getByText("Terminé")).toBeVisible();

  await adminContext.close();
});

test("a client cannot see another client's dossier", async ({ page, request, browser }) => {
  const ownerEmail = await loginAsNewClient(page, request, "e2e-portal-owner");
  const ownerId = await getUserIdByEmail(ownerEmail);

  const adminContext = await browser.newContext();
  await loginAsAdmin(adminContext);
  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId: ownerId, taxYear: 2025 },
  });
  const { dossier } = await createRes.json();
  await adminContext.close();

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await loginAsNewClient(otherPage, otherContext.request, "e2e-portal-other");

  const res = await otherContext.request.get(`/api/dossiers/${dossier.id}`);
  expect(res.status()).toBe(404);
  await otherContext.close();
});
