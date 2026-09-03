import type { DossierStatus } from "@/db/schema";

/**
 * Status constants live outside the `"use client"` StatusBadge module on
 * purpose: a server component importing a value from a client module receives
 * a client-reference proxy rather than the value itself, so `STATUS_ORDER`
 * would arrive as an object with no array methods.
 */
export const STATUS_ORDER: DossierStatus[] = [
  "not_started",
  "submitted",
  "in_review",
  "completed",
];

export const STATUS_CLASS: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started-soft text-status-not-started",
  submitted: "bg-status-submitted-soft text-status-submitted",
  in_review: "bg-status-in-review-soft text-status-in-review",
  completed: "bg-status-completed-soft text-status-completed",
};
