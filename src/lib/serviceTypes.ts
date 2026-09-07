import type { Messages } from "@/lib/i18n/messages/fr";

/**
 * The six prestations advertised on the marketing page, plus `relecture`.
 *
 * Kept outside any `"use client"` module: a server component importing a value
 * from a client module receives a client-reference proxy rather than the value,
 * so `SERVICE_TYPES` would arrive without its array methods.
 *
 * `declaration` is the original dossier kind — every row that existed before
 * service types were introduced is one, which is why it is the column default.
 */
export const SERVICE_TYPES = [
  "declaration",
  "capital",
  "departure",
  "deces",
  "simulation",
  "acompte",
  "relecture",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export function isServiceType(value: unknown): value is ServiceType {
  return (SERVICE_TYPES as readonly unknown[]).includes(value);
}

/**
 * Prestations a client opens for themselves. Declarations stay admin-created:
 * the firm opens the year's dossier once the period is active, which is the
 * flow the portal and the admin table were built around.
 */
export const CLIENT_CREATABLE: readonly ServiceType[] = SERVICE_TYPES.filter(
  (t) => t !== "declaration",
);

/** URL segment for a prestation's portal and admin pages. */
export const SERVICE_SLUG: Record<ServiceType, string> = {
  declaration: "declarations",
  capital: "capital",
  departure: "depart-etranger",
  deces: "deces",
  simulation: "simulation",
  acompte: "acomptes",
  relecture: "relecture",
};

export const SLUG_TO_SERVICE: Record<string, ServiceType> = Object.fromEntries(
  SERVICE_TYPES.map((t) => [SERVICE_SLUG[t], t]),
) as Record<string, ServiceType>;

export function serviceLabel(t: Messages, type: ServiceType): string {
  return t.services.types[type].name;
}

export function serviceDescription(t: Messages, type: ServiceType): string {
  return t.services.types[type].desc;
}
