"use client";

import type { ChangeEvent, ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  inputMode?: "text" | "numeric" | "email";
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  min?: string;
  max?: string;
  autoFocus?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Field({ id, label, name, type = "text", ...rest }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        name={name ?? id}
        type={type}
        className="h-[50px] w-full rounded-xl border border-line-default bg-card px-4 text-[15px] text-strong outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
        {...rest}
      />
    </div>
  );
}

export function FormAlert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: ReactNode;
}) {
  const cls =
    variant === "error"
      ? "border-red-600/25 bg-red-100 text-red-600"
      : "border-green-600/25 bg-green-100 text-green-600";
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-sm leading-5 ${cls}`}
    >
      {children}
    </div>
  );
}
