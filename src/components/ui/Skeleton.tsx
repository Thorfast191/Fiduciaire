/**
 * Placeholder blocks shown while a route's data loads.
 *
 * Every route renders per request — the nonce-based CSP requires it — so the
 * gap between clicking and seeing content is real on every navigation. These
 * stand in at roughly the shape of what arrives, so the page does not appear
 * to jump.
 */
export function SkeletonPage({
  rows = 3,
  withHeader = true,
}: {
  rows?: number;
  withHeader?: boolean;
}) {
  return (
    <div className="max-w-[1040px] animate-pulse" aria-hidden="true">
      {withHeader ? (
        <>
          <div className="h-[34px] w-[280px] rounded-md bg-sunken" />
          <div className="mt-3 h-[18px] w-[420px] max-w-full rounded bg-sunken" />
        </>
      ) : null}

      <div className="mt-7 flex flex-col gap-3.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-line bg-card p-6"
          >
            <div className="h-[14px] w-[140px] rounded bg-sunken" />
            <div className="mt-3.5 h-[20px] w-[70%] rounded bg-sunken" />
            <div className="mt-2.5 h-[14px] w-[45%] rounded bg-sunken" />
          </div>
        ))}
      </div>
    </div>
  );
}
