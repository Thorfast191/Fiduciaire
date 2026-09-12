import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDossier } from "@/lib/dossiers";
import { getClientById } from "@/lib/adminUsers";
import { listDocumentsForDossier } from "@/lib/documents";
import { CLOSURE_CATEGORIES } from "@/lib/documentCategories";
import {
  computePrice,
  normaliseAnswers,
  requiredDocuments,
  summariseAnswers,
} from "@/lib/declaration";
import { documentTitle } from "@/lib/documentTitle";
import { getT } from "@/lib/i18n";
import { renderDeclarationFormPdf } from "@/lib/pdf/declarationForm";

/**
 * Streams the declaration questionnaire as a filing-ready PDF.
 *
 * This is the "Télécharger le formulaire (PDF)" button on the admin dossier
 * page: the answers, remarks, documents checklist and tariff laid out for
 * paper. Administrators only — an ordinary admin gets it for a dossier
 * reserved to them, matching what the detail page itself will open.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const access = await getAccessibleDossier(id, { id: user.id, role: user.role });
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (user.role === "admin" && access.dossier.reservedBy !== user.id) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const [client, documents, { t }] = await Promise.all([
    getClientById(access.dossier.clientId),
    listDocumentsForDossier(id),
    getT(),
  ]);

  const d = t.declaration;
  const s = d.summary;
  const f = t.admin.detail.formPdf;

  const answers = normaliseAnswers(access.dossier.answers);
  const price = computePrice(answers);
  const required = requiredDocuments(answers);
  const uploaded = new Set<string>(documents.map((doc) => doc.category));

  const sections = summariseAnswers(answers, {
    yes: d.yes,
    no: d.no,
    none: s.none,
    situations: d.situations as unknown as Record<string, string>,
    marital: {
      celibataire: d.famille.celibataire,
      marie: d.famille.marie,
      partenariat: d.famille.partenariat,
      divorce: d.famille.divorce,
      veuf: d.famille.veuf,
    },
    income: {
      salarie: d.revenus.salarie,
      etudiant: d.revenus.etudiant,
      independant: d.revenus.independant,
      rentier: d.revenus.rentier,
      chomage: d.revenus.chomage,
      autre: d.revenus.autre,
    },
    wealth: {
      epargne: d.fortune.epargne,
      titres: d.fortune.titres,
      crypto: d.fortune.crypto,
      assuranceVie: d.fortune.assuranceVie,
      immeuble: d.fortune.immeuble,
      aucun: d.fortune.aucun,
    },
  });

  const date = (value: Date | null): string | null =>
    value
      ? new Intl.DateTimeFormat("fr-CH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(value)
      : null;

  // The "received" date the list column shows is the submission; a dossier
  // never submitted has none, and the form says so rather than showing today.
  const submittedOn =
    access.dossier.status === "not_started" ? null : date(access.dossier.createdAt);

  const statuses = t.status as unknown as Record<string, string>;
  const isClosure = (cat: string) =>
    (CLOSURE_CATEGORIES as readonly string[]).includes(cat);
  const clientDocs = documents.filter((doc) => !isClosure(doc.category));

  const pdf = renderDeclarationFormPdf({
    firm: { name: f.firmName, email: f.firmEmail },
    client: {
      name: client ? `${client.firstName} ${client.lastName}`.trim() : "—",
      email: client?.email,
      phone: client?.phone ?? undefined,
      address: [
        client?.street,
        [client?.postalCode, client?.city].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", "),
    },
    taxYear: String(access.dossier.taxYear),
    submittedOn,
    canton: answers.canton || undefined,
    status: statuses[access.dossier.status] ?? access.dossier.status,
    sections: sections.map((section) => ({
      title: d.steps[section.step],
      rows: section.rows.map((row) => ({
        label: s.labels[row.key as keyof typeof s.labels] ?? row.key,
        value: row.value,
      })),
      remark: section.remark,
      remarkLabel: s.remark,
    })),
    // The declaration has a derived checklist; other prestations only have
    // whatever the client actually uploaded.
    documents:
      access.dossier.serviceType === "declaration"
        ? required.map((key) => ({
            title: documentTitle(t, key),
            received: uploaded.has(key),
          }))
        : clientDocs.map((doc) => ({
            title: documentTitle(t, doc.category),
            received: true,
          })),
    price: price.lines.map((line) => ({
      label:
        (d.price[line.key as keyof typeof d.price] ?? line.key) +
        (line.count && line.count > 1 ? ` × ${line.count}` : ""),
      amountChf: line.amount,
    })),
    priceTotalChf: price.total,
    labels: {
      title: f.title,
      period: t.admin.detail.periodLabel,
      client: f.client,
      submittedOn: f.submittedOn,
      status: f.status,
      canton: f.canton,
      documents: s.docsTitle,
      received: f.received,
      missing: s.docsMissing,
      price: t.admin.detail.priceTitle,
      total: d.transmission.total,
      page: f.page,
      of: f.of,
      generated: f.generated.replace("{date}", date(new Date()) ?? ""),
      notSubmitted: f.notSubmitted,
    },
  });

  const safeName = `${client?.lastName ?? "client"}-${access.dossier.taxYear}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "-")
    .toLowerCase();

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="formulaire-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
