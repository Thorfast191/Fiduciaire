/**
 * The one definition of "strong enough" for a Fiduvia password.
 *
 * Deliberately dependency-free so the signup form (a client component) and the
 * three routes that accept a new password can share it. If the two ever drift,
 * the form promises a rule the server does not enforce — or worse, rejects a
 * password the form said was fine.
 */

export const PASSWORD_MIN_LENGTH = 10;

export interface PasswordChecks {
  /** At least PASSWORD_MIN_LENGTH characters. */
  length: boolean;
  /** At least one digit. */
  digit: boolean;
  /** At least one character that is neither a letter nor a digit. */
  symbol: boolean;
}

export function passwordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password: string): boolean {
  const checks = passwordChecks(password);
  return checks.length && checks.digit && checks.symbol;
}
