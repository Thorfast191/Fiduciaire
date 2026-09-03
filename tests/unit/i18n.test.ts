import { describe, it, expect } from "vitest";
import { fr } from "../../src/lib/i18n/messages/fr";
import { en } from "../../src/lib/i18n/messages/en";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
} from "../../src/lib/i18n/config";
import { otpEmailTemplate } from "../../src/lib/email/templates/otpEmail";

type Node = Record<string, unknown>;

/** Every leaf path in a bundle, so the two can be compared structurally. */
function paths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => paths(v, `${prefix}[${i}]`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Node).flatMap(([k, v]) =>
      paths(v, prefix ? `${prefix}.${k}` : k),
    );
  }

  return [prefix];
}

describe("locale config", () => {
  it("recognises only the supported locales", () => {
    expect(LOCALES).toEqual(["fr", "en"]);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("defaults to French", () => {
    expect(DEFAULT_LOCALE).toBe("fr");
  });
});

describe("message bundles", () => {
  it("expose exactly the same keys in both locales", () => {
    expect(paths(en).sort()).toEqual(paths(fr).sort());
  });

  it("have no empty strings", () => {
    for (const bundle of [fr, en]) {
      const empties = paths(bundle).filter((p) => {
        const value = p
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .reduce<unknown>((acc, k) => (acc as Node)?.[k], bundle);
        return typeof value === "string" && value.trim() === "";
      });
      expect(empties).toEqual([]);
    }
  });

  it("actually translate the copy rather than repeating French", () => {
    expect(en.hero.title).not.toBe(fr.hero.title);
    expect(en.nav.about).not.toBe(fr.nav.about);
    expect(en.portal.greeting).not.toBe(fr.portal.greeting);
    expect(en.status.completed).not.toBe(fr.status.completed);
  });

  it("keeps the French strings the E2E suite pins byte-identical", () => {
    expect(fr.auth.fields.firstName).toBe("Prénom");
    expect(fr.auth.fields.lastName).toBe("Nom");
    expect(fr.auth.fields.email).toBe("Adresse e-mail");
    expect(fr.auth.fields.password).toBe("Mot de passe");
    expect(fr.auth.signup.submit).toBe("Créer mon compte");
    expect(fr.auth.login.submit).toBe("Se connecter");
    expect(fr.auth.verify.submit).toBe("Vérifier le code");
    expect(fr.status.submitted).toBe("Soumis");
    expect(fr.status.completed).toBe("Terminé");
  });
});

describe("otpEmailTemplate", () => {
  it("includes the code in both html and text bodies", () => {
    const result = otpEmailTemplate({ code: "123456", purpose: "login" });
    expect(result.html).toContain("123456");
    expect(result.text).toContain("123456");
    expect(result.subject.length).toBeGreaterThan(0);
  });

  it("uses different subject copy for password_reset", () => {
    const login = otpEmailTemplate({ code: "111111", purpose: "login" });
    const reset = otpEmailTemplate({
      code: "111111",
      purpose: "password_reset",
    });
    expect(login.subject).not.toBe(reset.subject);
  });

  it("renders in the recipient's locale and falls back to French", () => {
    const french = otpEmailTemplate({
      code: "222222",
      purpose: "login",
      locale: "fr",
    });
    const english = otpEmailTemplate({
      code: "222222",
      purpose: "login",
      locale: "en",
    });

    expect(french.subject).toBe("Votre code de connexion Fiduvia");
    expect(english.subject).toBe("Your Fiduvia login code");
    expect(english.text).toContain("expires in 10 minutes");

    // No locale supplied → French, matching the users.locale column default.
    expect(otpEmailTemplate({ code: "333333", purpose: "login" }).subject).toBe(
      french.subject,
    );
  });
});
