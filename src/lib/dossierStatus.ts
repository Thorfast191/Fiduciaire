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
  "documents_requested",
  "documents_received",
  "completed",
];

export const STATUS_CLASS: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started-soft text-status-not-started",
  submitted: "bg-status-submitted-soft text-status-submitted",
  in_review: "bg-status-in-review-soft text-status-in-review",
  // Waiting on the client reads as a warning; the documents arriving reads as
  // progress, so it borrows the "submitted" treatment rather than a new colour.
  documents_requested: "bg-[#FBF0DD] text-[#B26A00]",
  documents_received: "bg-status-submitted-soft text-status-submitted",
  completed: "bg-status-completed-soft text-status-completed",
};
