import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * A minimal Stripe client over `fetch`, rather than the `stripe` SDK.
 *
 * The app only needs three things from Stripe — create a Checkout Session,
 * read one back, and verify a webhook signature — and all three are a few lines
 * against the REST API. Avoiding the SDK keeps the dependency (and the Docker
 * image) lean and sidesteps its Node runtime assumptions. The account is Swiss
 * and prices are whole francs, so amounts are converted to centimes here.
 */

const API = "https://api.stripe.com/v1";

export function stripeConfigured(): boolean {
  return env.STRIPE_SECRET_KEY.length > 0;
}

/** Stripe expects application/x-www-form-urlencoded with bracketed nested keys. */
function encodeForm(obj: Record<string, string | number>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

async function stripeRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, string | number>,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? encodeForm(body) : undefined,
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(`Stripe ${method} ${path} failed: ${json.error?.message ?? res.status}`);
  }
  return json;
}

export interface CheckoutSession {
  id: string;
  url: string | null;
  payment_status: string;
  payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string>;
}

export async function createCheckoutSession(params: {
  amountChf: number;
  productName: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  clientReferenceId: string;
  metadata: Record<string, string>;
  /** Deduplicates a double-clicked "pay" so it does not open two sessions. */
  idempotencyKey?: string;
}): Promise<{ id: string; url: string }> {
  const body: Record<string, string | number> = {
    mode: "payment",
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": "chf",
    "line_items[0][price_data][unit_amount]": Math.round(params.amountChf * 100),
    "line_items[0][price_data][product_data][name]": params.productName,
    customer_email: params.customerEmail,
    client_reference_id: params.clientReferenceId,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    // Stripe emails the client a receipt for a successful payment when receipts
    // are enabled on the account.
    "payment_intent_data[receipt_email]": params.customerEmail,
  };
  for (const [k, v] of Object.entries(params.metadata)) {
    body[`metadata[${k}]`] = v;
    body[`payment_intent_data[metadata][${k}]`] = v;
  }

  const session = await stripeRequest<CheckoutSession>(
    "/checkout/sessions",
    "POST",
    body,
    params.idempotencyKey,
  );
  if (!session.url) throw new Error("Stripe returned a session with no URL");
  return { id: session.id, url: session.url };
}

export async function retrieveCheckoutSession(
  id: string,
): Promise<CheckoutSession> {
  return stripeRequest<CheckoutSession>(
    `/checkout/sessions/${encodeURIComponent(id)}`,
    "GET",
  );
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: CheckoutSession & Record<string, unknown> };
}

/**
 * Verifies a webhook came from Stripe and returns the parsed event, or null.
 *
 * Reimplements `stripe.webhooks.constructEvent`: the `Stripe-Signature` header
 * carries a timestamp and one or more `v1` HMAC-SHA256 signatures over
 * `"<timestamp>.<rawBody>"`, keyed by the endpoint's signing secret. The
 * comparison is constant-time, and a timestamp outside the tolerance is
 * rejected to blunt replay. The RAW request body must be passed — a re-encoded
 * JSON body would not match the signature.
 */
export function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
): StripeEvent | null {
  if (!signatureHeader || !secret) return null;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    }),
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return null;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return null;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(rawBody) as StripeEvent;
  } catch {
    return null;
  }
}
