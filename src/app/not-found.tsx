import Link from "next/link";
import { getT } from "@/lib/i18n";

/**
 * A branded 404.
 *
 * Without this, a mistyped URL lands on Next's default page — jarring on a
 * site that is otherwise carefully art-directed, and worse for a fiduciary
 * whose clients need to feel they are in the right place.
 */
export default async function NotFound() {
  const { locale, t } = await getT();
  const n = t.notFound;

  return (
    <main
      lang={locale}
      className="flex min-h-screen items-center justify-center bg-[var(--surface-page)] px-6 py-16"
    >
      <div className="w-full max-w-[520px] text-center">
        <span className="flex items-center justify-center gap-[14px] leading-none">
          <span className="h-[30px] w-[2px] shrink-0 rounded-[1px] bg-[var(--gold)]" />
          <span
            className="whitespace-nowrap text-[26px] font-medium tracking-[0.1em] text-[var(--text-strong)]"
            style={{ fontFamily: "var(--font-mark)" }}
          >
            F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
          </span>
        </span>

        <p
          className="fx-figure mt-10 text-[64px] font-extrabold leading-none"
          style={{ color: "var(--brand)" }}
        >
          {n.code}
        </p>

        <h1
          className="disp text-[clamp(24px,3.4vw,30px)] font-extrabold leading-[1.1]"
          style={{ marginTop: "14px" }}
        >
          {n.title}
        </h1>

        <p
          className="mx-auto max-w-[420px] text-[15px] leading-[1.6] text-[var(--text-muted)]"
          style={{ marginTop: "12px" }}
        >
          {n.body}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="fx-btn-send">
            {n.home}
          </Link>

          <Link href="/portal" className="fx-btn-ghost">
            {n.portal}
          </Link>
        </div>
      </div>
    </main>
  );
}
