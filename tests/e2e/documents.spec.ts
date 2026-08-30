import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { getLatestOtpForEmail } from "./helpers/mailhog";

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

const SAMPLE_PDF = path.join(__dirname, "fixtures", "sample.pdf");

test("client uploads a document and sees it listed", async ({ page, request }) => {
  await loginAsNewClient(page, request, "e2e-doc-upload");

  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);

  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });
});

test("downloading a document returns the exact bytes that were uploaded", async ({ page, request }) => {
  await loginAsNewClient(page, request, "e2e-doc-download");
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  // The app opens the presigned download URL in a new tab via window.open,
  // and MinIO's response carries Content-Disposition: attachment from the
  // first byte. Chromium recognizes that navigation as a download before
  // the popup ever commits any content, so the transient popup tab closes
  // itself immediately and Playwright surfaces the "download" event on the
  // opener `page`, not on the popup object (verified by direct observation
  // in this environment). We still assert the popup fires, to confirm the
  // app really does open a new tab, but await the download on `page`.
  const [popup, download] = await Promise.all([
    page.waitForEvent("popup"),
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Télécharger" }).click(),
  ]);
  expect(popup).toBeTruthy();
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  const downloadedBytes = fs.readFileSync(downloadedPath!);
  const originalBytes = fs.readFileSync(SAMPLE_PDF);
  expect(downloadedBytes.equals(originalBytes)).toBe(true);
});

test("a client cannot see another client's uploaded document", async ({ page, request, browser }) => {
  await loginAsNewClient(page, request, "e2e-doc-owner");
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await loginAsNewClient(otherPage, otherContext.request, "e2e-doc-other");
  await expect(otherPage.getByText("sample.pdf")).not.toBeVisible();
  await otherContext.close();
});

test("deleting a document removes it from the list", async ({ page, request }) => {
  await loginAsNewClient(page, request, "e2e-doc-delete");
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("sample.pdf")).not.toBeVisible();
});
