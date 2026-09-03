import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim());
    return parts[parts.length - 1];
  }
  return "unknown";
}

/**
 * Parses a JSON request body without throwing on malformed input.
 *
 * `await request.json()` rejects when the body is not valid JSON, which
 * surfaces as an unhandled 500 rather than the 400 a client deserves. Callers
 * treat `undefined` the same way they treat a body that fails schema
 * validation.
 */
export async function readJsonBody(
  request: Request,
): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
