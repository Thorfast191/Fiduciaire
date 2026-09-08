import { describe, it, expect } from "vitest";
import { getLegalDoc, LEGAL_ROUTES, type LegalDocKey } from "@/lib/legal";

const KEYS: LegalDocKey[] = ["cookies", "mentions", "privacy", "cgvu"];

function allText(key: LegalDocKey): string {
  const doc = getLegalDoc(key);
  const parts: string[] = [doc.title];
  const collect = (blocks: ReturnType<typeof getLegalDoc>["intro"]) => {
    for (const b of blocks) {
      if (b.type === "p") parts.push(b.text);
      else if (b.type === "ul") parts.push(...b.items);
      else parts.push(...b.lines);
    }
  };
  collect(doc.intro);
  for (const s of doc.sections) {
    parts.push(s.heading);
    collect(s.blocks);
  }
  return parts.join("\n");
}

describe("legal documents", () => {
  it("exposes all four documents with sections and an update date", () => {
    for (const key of KEYS) {
      const doc = getLegalDoc(key);
      expect(doc.title.length, `${key} title`).toBeGreaterThan(0);
      expect(doc.updated, `${key} updated`).toMatch(/2026/);
      expect(doc.sections.length, `${key} sections`).toBeGreaterThan(0);
    }
  });

  it("carries no unresolved template placeholders from the mockup", () => {
    for (const key of KEYS) {
      expect(allText(key), `${key}`).not.toMatch(/\{\{|\}\}/);
    }
  });

  it("every section has a heading and content", () => {
    for (const key of KEYS) {
      for (const section of getLegalDoc(key).sections) {
        expect(section.heading.length, `${key} heading`).toBeGreaterThan(0);
        expect(section.blocks.length, `${key} "${section.heading}"`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the real firm identity, not the old placeholder", () => {
    const mentions = allText("mentions");
    expect(mentions).toContain("Route de la Pontille 28");
    expect(mentions).toContain("Rathana Leas");
    expect(mentions).not.toContain("Rue de Bourg");
  });

  it("maps every document to a unique route slug", () => {
    const slugs = KEYS.map((k) => LEGAL_ROUTES[k].slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
