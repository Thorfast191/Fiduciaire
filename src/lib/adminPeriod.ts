/**
 * Resolves which fiscal period an admin page should show.
 *
 * Prefers an explicit `?periode=`, then the current tax period (last calendar
 * year) when it has dossiers, and only then the newest period on record — a
 * single dossier mis-filed under a far-future year must not become the default
 * view for the whole admin area.
 */
export function resolvePeriod(periods: number[], requested?: string): number {
  const asked = Number(requested);
  if (asked && periods.includes(asked)) return asked;

  const currentTaxYear = new Date().getFullYear() - 1;
  if (periods.includes(currentTaxYear)) return currentTaxYear;

  return periods[0] ?? currentTaxYear;
}
