import type { Messages } from "@/lib/i18n/messages/fr";
import { DocumentLink } from "./DocumentLink";

export interface RequestedPiece {
  title: string;
  /** What the client deposited against this request, if anything yet. */
  doc: { id: string; filename: string } | null;
}

/**
 * What was asked of the client, and what has come back.
 *
 * The document count above says 5 / 12 but not *which* five, and the pieces
 * the firm actually chased are the ones an administrator wants to see land.
 * This lists exactly the request, in the order it was made, with a download
 * beside each piece that has arrived.
 */
export default function RequestedPieces({
  t,
  pieces,
}: {
  t: Messages;
  pieces: RequestedPiece[];
}) {
  if (pieces.length === 0) return null;

  const received = pieces.filter((p) => p.doc).length;
  const r = t.admin.detail.requestedPieces;

  return (
    <section className="mt-4 rounded-2xl border border-line bg-card px-6 py-[22px]">
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2.5">
        <h2 className="text-[16px] font-bold text-strong">{r.title}</h2>
        <span className="fx-figure text-[14px] text-muted">
          {received} / {pieces.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {pieces.map((piece) => (
          <div
            key={piece.title}
            className="flex flex-wrap items-center gap-3.5 rounded-xl border border-line px-3.5 py-3"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                piece.doc
                  ? "bg-[#E6F6EE] text-[#1F8A5B]"
                  : "bg-[#FBF0DD] text-[#B26A00]"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="h-[19px] w-[19px]"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>

            <span className="min-w-[150px] flex-1">
              <span className="block text-[14.5px] font-semibold text-strong">
                {piece.title}
              </span>
              <span
                className={`mt-0.5 block truncate text-[13px] ${
                  piece.doc ? "text-muted" : "text-[#B26A00]"
                }`}
              >
                {piece.doc ? piece.doc.filename : r.awaiting}
              </span>
            </span>

            {piece.doc ? (
              <DocumentLink documentId={piece.doc.id} label={r.download} />
            ) : (
              <span className="rounded-full bg-sunken px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted">
                {r.pending}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
