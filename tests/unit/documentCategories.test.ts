import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DOCUMENT_CATEGORIES } from "../../src/lib/documentCategories";
import { DOCUMENT_CATALOGUE } from "../../src/lib/declaration";

/**
 * Every category the client UI can upload under must be in
 * DOCUMENT_CATEGORIES, because `createPendingUpload` rejects anything else.
 *
 * Three prestations shipped with a category the list did not know:
 * `attestationCapital`, `formulaireAcomptes` and `copieDeclaration`. Nothing
 * caught it — the form posts a plain string, the route returns a generic
 * "invalid_category", and the client only ever saw "An error has occurred".
 * This test reads the categories back out of the source so a new form cannot
 * introduce a fourth.
 */
const PORTAL = join(__dirname, "../../src/app/portal");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Category literals the portal passes to an upload, however it spells it. */
function uploadedCategories(): { category: string; file: string }[] {
  const patterns = [
    /\.upload\(\s*\w+\s*,\s*"([a-zA-Z_]+)"/g, // p.upload(file, "x", …)
    /DOC_CATEGORY\s*=\s*"([a-zA-Z_]+)"/g, // const DOC_CATEGORY = "x"
  ];
  const found: { category: string; file: string }[] = [];
  for (const file of sourceFiles(PORTAL)) {
    const src = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      for (const m of src.matchAll(pattern)) {
        found.push({ category: m[1], file: file.replace(PORTAL, "portal") });
      }
    }
  }
  return found;
}

describe("document categories", () => {
  it("finds the upload categories in the portal source", () => {
    // A guard on the guard: if the patterns stop matching, the test below
    // would pass vacuously.
    expect(uploadedCategories().length).toBeGreaterThanOrEqual(3);
  });

  it("allows every category a portal form uploads", () => {
    const allowed = new Set<string>(DOCUMENT_CATEGORIES);
    const rejected = uploadedCategories().filter(
      (u) => !allowed.has(u.category),
    );
    expect(
      rejected,
      `these would be refused as invalid_category: ${rejected
        .map((r) => `${r.category} (${r.file})`)
        .join(", ")}`,
    ).toEqual([]);
  });

  it("allows every piece the questionnaire asks for", () => {
    const allowed = new Set<string>(DOCUMENT_CATEGORIES);
    const missing = Object.keys(DOCUMENT_CATALOGUE).filter(
      (key) => !allowed.has(key),
    );
    expect(missing).toEqual([]);
  });

  it("names every category, so nothing renders as a raw key", async () => {
    const { fr } = await import("../../src/lib/i18n/messages/fr");
    const labelled = new Set([
      ...Object.keys(DOCUMENT_CATALOGUE),
      ...Object.keys(fr.documents.categories),
    ]);
    const unnamed = DOCUMENT_CATEGORIES.filter((c) => !labelled.has(c));
    expect(unnamed).toEqual([]);
  });
});
