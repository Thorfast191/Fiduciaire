import type { Messages } from "@/lib/i18n/messages/fr";

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

  return [
    { kind: "head", label: n.servicesHead },
    { kind: "link", label: n.taxReturns, href: "/portal" },
    { kind: "soon", label: n.capital },
    { kind: "soon", label: n.simulation },
    { kind: "soon", label: n.instalments },
    { kind: "soon", label: n.review },
    { kind: "head", label: n.otherHead },
    { kind: "soon", label: n.assistance },
    { kind: "soon", label: n.payments },
    { kind: "soon", label: n.contacts },
  ];
}

export function adminNav(t: Messages): NavEntry[] {
  const n = t.admin.nav;

  return [
    { kind: "link", label: n.home, href: "/admin" },
    { kind: "link", label: n.dossiers, href: "/admin/dossiers" },
    { kind: "soon", label: n.stats },
    { kind: "soon", label: n.periods },
    { kind: "soon", label: n.users },
  ];
}
