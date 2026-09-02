export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-[18px] shadow-xs">
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <span
        className={`fx-figure text-[30px] font-extrabold ${accent ? "text-brand" : "text-strong"}`}
      >
        {value}
      </span>
      {hint && <span className="text-[12px] text-muted">{hint}</span>}
    </div>
  );
}
