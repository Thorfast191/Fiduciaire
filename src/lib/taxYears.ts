/**
 * The span of years offered in every year dropdown across the client space —
 * the capital "année du retrait", the simulation / acomptes / relecture period,
 * and the Fiduvia Assistance period. To extend how far ahead clients can pick,
 * bump `TAX_YEAR_MAX` here — it is the single place that controls all of them.
 */
export const TAX_YEAR_MIN = 2020;
export const TAX_YEAR_MAX = 2035;

/** Years from newest to oldest, for a dropdown. */
export function taxYearOptionsDesc(
  min: number = TAX_YEAR_MIN,
  max: number = TAX_YEAR_MAX,
): number[] {
  const out: number[] = [];
  for (let y = max; y >= min; y--) out.push(y);
  return out;
}
