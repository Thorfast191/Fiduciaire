import type { Messages } from "@/lib/i18n/messages/fr";
import { SERVICE_SLUG, type ServiceType } from "@/lib/serviceTypes";

/**
 * Sidebar nav definitions, transcribed from the client mockup.
 *
 * Client nav mirrors `Fiduvia.dc.html`'s `cNavDefs` (line 2826) and admin nav
 * mirrors `aNavDefs` (line 2952), including their order and grouping. Entries
 * for prestations the platform does not implement are kept as `soon` so the
 * sidebar matches the mockup structurally without offering dead links.
 */
export type NavEntry =
  | { kind: "head"; label: string }
  | { kind: "link"; label: string; href: string }
  | { kind: "soon"; label: string };

export function clientNav(t: Messages): NavEntry[] {
  const n = t.portal.nav;
  const prestation = (type: ServiceType) =>
    `/portal/prestations/${SERVICE_SLUG[type]}`;

  return [
    { kind: "head", label: n.servicesHead },
    { kind: "link", label: n.taxReturns, href: "/portal" },
    { kind: "link", label: n.capital, href: prestation("capital") },
    // The mockup reaches "départ" and "décès" from inside the declaration
    // questionnaire, which this project does not have. They are advertised on
    // the marketing page, so they get their own sidebar entries here rather
    // than being unreachable.
    { kind: "link", label: n.departure, href: prestation("departure") },
    { kind: "link", label: n.deces, href: prestation("deces") },
    { kind: "link", label: n.simulation, href: prestation("simulation") },
    { kind: "link", label: n.instalments, href: prestation("acompte") },
    { kind: "link", label: n.review, href: prestation("relecture") },
    { kind: "head", label: n.otherHead },
    { kind: "soon", label: n.assistance },
    { kind: "soon", label: n.payments },
    { kind: "link", label: n.contacts, href: "/portal/contacts" },
  ];
}

export function adminNav(t: Messages): NavEntry[] {
  const n = t.admin.nav;

  return [
    { kind: "link", label: n.home, href: "/admin" },
    { kind: "link", label: n.dossiers, href: "/admin/dossiers" },
    { kind: "link", label: n.stats, href: "/admin/stats" },
    { kind: "link", label: n.periods, href: "/admin/periodes" },
    { kind: "link", label: n.users, href: "/admin/utilisateurs" },
  ];
}
