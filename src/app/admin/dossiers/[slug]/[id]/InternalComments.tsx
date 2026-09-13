"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
}

/** The mockup's "Commentaires internes (équipe)" — team-only notes on a dossier. */
export default function InternalComments({
  dossierId,
  comments,
}: {
  dossierId: string;
  comments: Comment[];
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-CH" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  async function add() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      setDraft("");
      router.refresh();
    } catch {
      setError(t.admin.detail.errAction);
    } finally {
      setBusy(false);
    }
  }

  async function remove(commentId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/comments`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      router.refresh();
    } catch {
      setError(t.admin.detail.errAction);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-line bg-card px-6 py-[22px]">
      <h2 className="text-[16px] font-bold text-strong">
        {t.admin.detail.commentsTitle}
      </h2>

      <div className="mt-3.5 flex flex-col gap-2.5">
        {comments.length === 0 ? (
          <p className="text-[14px] text-muted">
            {t.admin.detail.commentsEmpty}
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-[12px] border border-line bg-sunken/40 px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-strong">
                  {c.authorName}
                </span>
                <span className="flex items-center gap-2">
                  <span className="fx-figure text-[11.5px] text-muted">
                    {dateFmt.format(new Date(c.createdAt))}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(c.id)}
                    aria-label={t.admin.detail.commentDelete}
                    className="text-[11.5px] font-medium text-muted underline transition hover:text-red-600 disabled:opacity-60"
                  >
                    {t.admin.detail.commentDelete}
                  </button>
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-[1.5] text-body">
                {c.body}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3.5 flex gap-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder={t.admin.detail.commentPlaceholder}
          className="flex-1 rounded-[11px] border border-line-default bg-card px-3.5 py-2.5 text-[14px] text-strong outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={add}
          className="rounded-[11px] bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t.admin.detail.commentAdd}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
