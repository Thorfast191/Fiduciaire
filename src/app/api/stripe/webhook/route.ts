import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyStripeWebhook } from "@/lib/stripe";
import { finalizeCheckoutSession } from "@/lib/checkout";
import { logger } from "@/lib/logger";

/**
 * Stripe webhook endpoint.
 *
 * Authenticated by the signature, not a session cookie — Stripe is the caller.
 * The RAW request body is required to verify that signature, so it is read as
 * text and never parsed before verification. A `checkout.session.completed`
 * event settles the matching payment and submits the dossier; the handler is
 * idempotent, so Stripe's at-least-once redelivery is harmless.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const event = verifyStripeWebhook(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );
  if (!event) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const result = await finalizeCheckoutSession(event.data.object);
      if (result.finalized) {
        logger.info(
          { sessionId: event.data.object.id },
          "checkout finalized via webhook",
        );
      }
    }
  } catch (err) {
    // Return 500 so Stripe retries rather than dropping the event.
    logger.error({ err, eventId: event.id }, "stripe webhook handler failed");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
