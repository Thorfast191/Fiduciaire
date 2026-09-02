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

export const CLIENT_NAV: NavEntry[] = [
  { kind: "head", label: "Prestations" },
  { kind: "link", label: "Déclarations d'impôts", href: "/portal" },
  { kind: "soon", label: "Prestation en capital" },
  { kind: "soon", label: "Simulation d'impôts" },
  { kind: "soon", label: "Détermination acomptes" },
  { kind: "soon", label: "Relecture" },
  { kind: "head", label: "Divers" },
  { kind: "soon", label: "Assistance" },
  { kind: "soon", label: "Paiements" },
  { kind: "soon", label: "Contacts" },
];

export const ADMIN_NAV: NavEntry[] = [
  { kind: "link", label: "Accueil", href: "/admin" },
  { kind: "link", label: "Dossiers", href: "/admin/dossiers" },
  { kind: "soon", label: "Statistiques" },
  { kind: "soon", label: "Périodes" },
  { kind: "soon", label: "Utilisateurs" },
];
