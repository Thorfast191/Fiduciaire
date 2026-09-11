"use client";

import type { ReactNode } from "react";

/** A labelled block inside a questionnaire card. */
export function Question({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-5 shadow-[var(--shadow-xs)] sm:p-6">
      <p className="disp m-0 text-[17px] font-bold">
        {label}
        {required ? <span className="ml-1 text-[#C0392B]">*</span> : null}
      </p>

      {hint ? (
        <p className="mt-1 text-[13.5px] leading-[1.45] text-muted">{hint}</p>
      ) : null}

      <div className="mt-4">{children}</div>
    </div>
  );
}

export function RadioRow({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-center gap-3 text-[15px] text-body"
        >
          <input
            type="radio"
            name={name}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="h-[18px] w-[18px] accent-[var(--brand)]"
          />
          <span className={value === o.value ? "font-semibold text-strong" : ""}>
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

export function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[15px] text-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-[18px] w-[18px] accent-[var(--brand)]"
      />
      <span className={checked ? "font-semibold text-strong" : ""}>{label}</span>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
      <span className="fx-field-label m-0">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="fx-field-input"
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
      {label ? <span className="fx-field-label m-0">{label}</span> : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="fx-field-input h-[46px] py-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
