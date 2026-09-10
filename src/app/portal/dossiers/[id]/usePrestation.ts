"use client";

import { useEffect, useState } from "react";
import type { DossierStatus } from "@/db/schema";

/**
 * Shared plumbing for the bespoke prestation forms (capital aside, which
 * predates this): load the dossier's answers/documents/status, upload or
 * remove the one required document, and finalize (save the form's fields, then
 * submit the dossier). Non-declaration prestations are priced by the firm, so
 * finalize submits directly with no online-payment step.
 */

const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 20 * 1024 * 1024;

export interface PrestationDoc {
  id: string;
  filename: string;
  category: string;
}

export function usePrestation(dossierId: string) {
  const [status, setStatus] = useState<DossierStatus>("not_started");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [docs, setDocs] = useState<PrestationDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/dossiers/${dossierId}`);
    if (!res.ok) return;
    const body = await res.json();
    setStatus(body.dossier.status);
    setAnswers(body.dossier.answers ?? {});
    setDocs(body.documents ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, []);

  /** Upload one file under `category`; returns whether it succeeded. */
  async function upload(
    file: File,
    category: string,
    labels: { type: string; big: string; generic: string },
  ): Promise<boolean> {
    setError("");
    if (!ALLOWED.includes(file.type)) {
      setError(labels.type);
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError(labels.big);
      return false;
    }
    setBusy(true);
    try {
      const startRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dossierId,
          filename: file.name,
          category,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!startRes.ok) {
        setError(labels.generic);
        return false;
      }
      const { documentId, uploadUrl } = await startRes.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) {
        setError(labels.generic);
        return false;
      }
      const conf = await fetch(`/api/documents/${documentId}/confirm`, {
        method: "POST",
      });
      if (!conf.ok) {
        setError(labels.generic);
        return false;
      }
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    const res = await fetch(`/api/documents/${id}/download-url`);
    if (!res.ok) return;
    const { downloadUrl } = await res.json();
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = downloadUrl;
  }

  /** Save the form's fields into the answers JSONB, then submit the dossier. */
  async function finalize(
    fields: Record<string, unknown>,
    genericError: string,
  ): Promise<boolean> {
    setError("");
    setBusy(true);
    try {
      const merged = { ...answers, ...fields };
      const saveRes = await fetch(`/api/dossiers/${dossierId}/answers`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: merged }),
      });
      if (!saveRes.ok) {
        setError(genericError);
        return false;
      }
      const sub = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });
      if (!sub.ok) {
        setError(genericError);
        return false;
      }
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return {
    status,
    answers,
    docs,
    loaded,
    busy,
    error,
    setError,
    upload,
    removeDoc,
    download,
    finalize,
  };
}
