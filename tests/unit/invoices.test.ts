import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { users, payments } from "@/db/schema";
import { assignInvoiceNumber } from "@/lib/invoices";
import { renderInvoicePdf, textWidth, type InvoiceData } from "@/lib/pdf/invoice";

function sampleData(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    invoiceNumber: "FID-2026-0042",
    issueDate: "12.03.2026",
    firm: {
      name: "Fiduvia",
      legalForm: "Raison individuelle",
      owner: "Rathana Leas",
      addressLine: "Route de la Pontille 28",
      cityLine: "1618 Châtel-St-Denis",
      email: "contact@fiduvia.ch",
    },
    client: { name: "Jérôme Müller", email: "jerome@example.test" },
    service: { label: "Déclaration d'impôts", period: "Période 2025", amountChf: 120 },
    method: "Carte de crédit",
    labels: {
      invoice: "FACTURE",
      number: "N°",
      date: "Date",
      billedTo: "Facturé à",
      description: "Description",
      amount: "Montant",
      total: "Total",
      paidBy: "Payé par Carte de crédit",
      vatNote: "TVA non applicable — chiffre d'affaires inférieur au seuil légal.",
      thanks: "Merci de votre confiance.",
    },
    ...overrides,
  };
}

describe("renderInvoicePdf", () => {
  it("emits a well-formed single-page PDF", () => {
    const pdf = renderInvoicePdf(sampleData());
    const head = pdf.subarray(0, 8).toString("latin1");
    const body = pdf.toString("latin1");

    expect(head).toBe("%PDF-1.4");
    expect(body.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(body).toContain("/Type /Catalog");
    expect(body).toContain("Helvetica");
    // The invoice number and firm name are ASCII, so they appear verbatim.
    expect(body).toContain("FID-2026-0042");
    expect(body).toContain("Fiduvia");
  });

  it("escapes parentheses so a label cannot break the PDF string", () => {
    const pdf = renderInvoicePdf(
      sampleData({ service: { label: "Conseil (spécial)", period: "P", amountChf: 90 } }),
    );
    // The '(' inside content must be backslash-escaped in the stream.
    expect(pdf.toString("latin1")).toContain("Conseil \\(sp");
  });
});

describe("textWidth", () => {
  it("grows with the string and the size", () => {
    expect(textWidth("WWWW", 12)).toBeGreaterThan(textWidth("ii", 12));
    expect(textWidth("Total", 16)).toBeGreaterThan(textWidth("Total", 10));
  });
});

async function makePaidPayment(year: number): Promise<string> {
  const [u] = await db
    .insert(users)
    .values({
      email: `inv-${randomUUID()}@example.test`,
      passwordHash: "x",
      firstName: "In",
      lastName: "Voice",
      role: "client",
    })
    .returning();
  const [p] = await db
    .insert(payments)
    .values({
      clientId: u.id,
      taxYear: year,
      label: "Déclaration",
      method: "card",
      amountChf: 80,
      status: "paid",
      paidAt: new Date(Date.UTC(year, 2, 12)),
    })
    .returning();
  return p.id;
}

describe("assignInvoiceNumber", () => {
  it("issues sequential FID-YEAR-#### numbers and is idempotent", async () => {
    // A private, high year keeps this test's counter isolated from other data.
    const year = 9100 + Math.floor(Math.random() * 800);

    const first = await assignInvoiceNumber(await makePaidPayment(year));
    const second = await assignInvoiceNumber(await makePaidPayment(year));

    expect(first).toBe(`FID-${year}-0001`);
    expect(second).toBe(`FID-${year}-0002`);
  });

  it("returns the same number on a repeat call, never a new one", async () => {
    const year = 8100 + Math.floor(Math.random() * 800);
    const id = await makePaidPayment(year);
    const a = await assignInvoiceNumber(id);
    const b = await assignInvoiceNumber(id);
    expect(a).toBe(`FID-${year}-0001`);
    expect(b).toBe(a);
  });

  it("gives an unpaid payment no number", async () => {
    const [u] = await db
      .insert(users)
      .values({
        email: `inv-${randomUUID()}@example.test`,
        passwordHash: "x",
        firstName: "No",
        lastName: "Pay",
        role: "client",
      })
      .returning();
    const [p] = await db
      .insert(payments)
      .values({
        clientId: u.id,
        taxYear: 675000,
        label: "Déclaration",
        method: "card",
        amountChf: 80,
        status: "pending",
      })
      .returning();

    expect(await assignInvoiceNumber(p.id)).toBeNull();
  });
});
