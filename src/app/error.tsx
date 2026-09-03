"use client";

import { fr } from "@/lib/i18n/messages/fr";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main
      style={{ maxWidth: 600, margin: "80px auto", fontFamily: "sans-serif" }}
    >
      <h1>{fr.common.errorTitle}</h1>
      <p>{fr.common.errorBody}</p>
    </main>
  );
}
