import { test, expect } from "@playwright/test";
import { getLatestOtpForEmail } from "./helpers/mailhog";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.test`;
}

test("signup → verify → reaches the client portal", async ({ page }) => {
  const email = uniqueEmail("e2e-signup");
  await page.goto("/signup");
  await page.getByLabel("Prénom").fill("Camille");
  await page.getByLabel("Nom", { exact: true }).fill("Rochat");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Vérifier le code" }).click();

  await page.waitForURL("/portal");
  // The portal greets the signed-in client by name; the email is no longer
  // printed on the home page, so assert on who we landed as instead.
  await expect(
    page.getByRole("heading", { name: "Bonjour Camille" }),
  ).toBeVisible();
});

test("login → verify → reaches the client portal", async ({ page, request }) => {
  const email = uniqueEmail("e2e-login");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
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
});

test("wrong password shows a generic error and does not proceed", async ({ page, request }) => {
  const email = uniqueEmail("e2e-wrongpw");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });

  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("totally-wrong");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.locator("main").getByRole("alert")).toHaveText("Adresse e-mail ou mot de passe incorrect.");
  await expect(page).toHaveURL(/\/login/);
});

test("locks out after 5 wrong OTP attempts", async ({ page, request }) => {
  const email = uniqueEmail("e2e-otplock");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });
  await getLatestOtpForEmail(email);

  await page.goto(`/verify?email=${encodeURIComponent(email)}&purpose=signup`);
  for (let i = 0; i < 5; i++) {
    await page.getByPlaceholder("000000").fill("000000");
    await page.getByRole("button", { name: "Vérifier le code" }).click();
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
  }
  await expect(page.locator("main").getByRole("alert")).toHaveText("Trop de tentatives. Demandez un nouveau code.");
});

test("locks out after 5 failed login attempts from the same browser", async ({ page, request }) => {
  const email = uniqueEmail("e2e-loginlock");
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });

  await page.goto("/login");
  for (let i = 0; i < 5; i++) {
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill("wrong-each-time");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
  }
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("wrong-each-time");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Trop de tentatives. Réessayez dans quelques minutes.");
});

test("admin login reaches the admin dashboard, not the client portal", async ({ page, request }) => {
  // Assumes the Task 18 seed script has been run for this admin account.
  const email = "admin@fiduvia.test";
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Vérifier le code" }).click();
  await page.waitForURL("/admin");

  await page.goto("/portal");
  await expect(page).not.toHaveURL("/portal");
});

test("security headers are present on page routes, and HSTS is absent", async ({ page }) => {
  const response = await page.goto("/login");
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("script-src 'self' 'nonce-");
  expect(headers["strict-transport-security"]).toBeUndefined();
});
