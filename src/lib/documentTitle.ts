import { DOCUMENT_CATALOGUE } from "@/lib/declaration";
import type { Messages } from "@/lib/i18n/messages/fr";

/**
 * The human title for a stored document's category.
 *
 * Categories come from two places: the questionnaire's `DOCUMENT_CATALOGUE`,
 * which names each piece it asks for, and the six legacy buckets plus the
 * three closure documents, which only ever had i18n labels. Both the dossier
 * screen and the two PDF downloads have to resolve either kind, so the lookup
 * lives here rather than being repeated with a raw-key fallback that leaks
 * `certSalaire` into a client-facing file.
 */
export function documentTitle(
  t: Pick<Messages, "documents">,
  category: string,
): string {
  const catalogue =
    DOCUMENT_CATALOGUE[category as keyof typeof DOCUMENT_CATALOGUE]?.title;
  if (catalogue) return catalogue;

  const labels = t.documents.categories as Record<string, string | undefined>;
  return labels[category] ?? category;
}
