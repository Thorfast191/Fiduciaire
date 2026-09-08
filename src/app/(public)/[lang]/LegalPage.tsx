import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { Locale } from "@/lib/i18n/config";
import { localeHref } from "@/components/LocaleSwitch";
import {
  getLegalDoc,
  type LegalBlock,
  type LegalDocKey,
} from "@/lib/legal";

/**
 * Renders one legal document — the client's own French text, ported from the
 * mockup and held as structured data in `src/content/legal.fr.json`.
 *
 * The document is authoritative in French; on the English routes it is shown
 * under a short notice to that effect rather than machine-translated, which is
 * the usual practice for a Swiss SME's binding legal terms.
 */
export function LegalPage({
  lang,
  t,
  docKey,
}: {
  lang: Locale;
  t: Messages;
  docKey: LegalDocKey;
}) {
  const doc = getLegalDoc(docKey);

  return (
    <main
      lang={lang}
      className="min-h-screen bg-[var(--surface-page)] px-6 py-16 text-[var(--text-body)]"
    >
      <div className="mx-auto w-full max-w-[760px]">
        <Link
          href={localeHref(lang)}
          className="text-[13px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
        >
          ← {t.legal.backHome}
        </Link>

        <h1 className="disp mt-5 text-[clamp(28px,3.8vw,38px)] font-extrabold leading-[1.08]">
          {doc.title}
        </h1>

        {doc.updated ? (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {t.legal.updated} {doc.updated}
          </p>
        ) : null}

        {lang === "en" ? (
          <p className="mt-5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-5 py-4 text-[13.5px] leading-[1.6] text-[var(--text-muted)]">
            {t.legal.frOnlyNotice}
          </p>
        ) : null}

        {doc.intro.length > 0 ? (
          <div className="mt-6 flex flex-col gap-4 text-[15px] leading-[1.75] text-[var(--text-body)]">
            {doc.intro.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>
        ) : null}

        <div className="mt-2">
          {doc.sections.map((section, i) => (
            <section key={i} className="mt-9">
              <h2 className="disp text-[18px] font-bold leading-[1.3] text-[var(--text-strong)]">
                {section.heading}
              </h2>
              <div className="mt-3.5 flex flex-col gap-3.5 text-[15px] leading-[1.75] text-[var(--text-body)]">
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "p") {
    return <p className="m-0">{block.text}</p>;
  }

  if (block.type === "ul") {
    return (
      <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 marker:text-[var(--text-muted)]">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  // An identity / contact card — the firm's coordinates set apart from the prose.
  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 py-5 text-[14.5px] text-[var(--text-strong)]">
      {block.lines.map((line, i) => (
        <span key={i} className={i === 0 ? "font-semibold" : ""}>
          {line}
        </span>
      ))}
    </div>
  );
}
