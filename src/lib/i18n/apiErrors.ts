import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

/**
 * User-facing error strings returned by route handlers.
 *
 * Kept separate from the UI bundles because routes cannot use `getLocale()` —
 * they read the cookie off the request they are handling. The French strings
 * are byte-identical to what the routes returned before, so the enumeration
 * guarantees (one generic message for every login failure mode) and the E2E
 * assertions both still hold.
 */
const ERRORS = {
  fr: {
    badCredentials: "Adresse e-mail ou mot de passe incorrect.",
    tooManyLogins: "Trop de tentatives. Réessayez dans quelques minutes.",
    badCode: "Code incorrect ou expiré.",
    tooManyCodes: "Trop de tentatives. Demandez un nouveau code.",
    checkInput: "Merci de vérifier les informations saisies.",
    emailExists: "Un compte existe déjà avec cette adresse e-mail.",
    invalidTransition: "Transition de statut non autorisée.",
    dossierNotFound: "Dossier introuvable.",
  },
  en: {
    badCredentials: "Incorrect email address or password.",
    tooManyLogins: "Too many attempts. Please try again in a few minutes.",
    badCode: "Incorrect or expired code.",
    tooManyCodes: "Too many attempts. Please request a new code.",
    checkInput: "Please check the information you entered.",
    emailExists: "An account already exists with this email address.",
    invalidTransition: "That status change is not allowed.",
    dossierNotFound: "File not found.",
  },
} satisfies Record<Locale, Record<string, string>>;

export type ApiErrors = (typeof ERRORS)[Locale];

export function apiErrors(request: NextRequest): ApiErrors {
  const value = request.cookies.get(LOCALE_COOKIE)?.value;
  return ERRORS[isLocale(value) ? value : DEFAULT_LOCALE];
}
