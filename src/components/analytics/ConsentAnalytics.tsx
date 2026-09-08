"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Cookie-consent gate for the marketing pages' analytics tags.
 *
 * Switzerland's revised nLPD and EU visitors mean the Google and Meta tags may
 * not fire until the visitor has agreed, so nothing loads on first paint: the
 * banner is shown, the choice is remembered in localStorage, and only an
 * explicit "accept" injects the tags. A refusal is remembered too, so the
 * banner does not nag.
 *
 * The injected scripts carry the per-request CSP nonce — the same one in the
 * `script-src` policy from `src/proxy.ts` — so they are allowed to run; the
 * third-party hosts they then reach are allowlisted there under
 * script/connect/img-src.
 */

const STORAGE_KEY = "fiduvia-consent";
type Decision = "granted" | "denied";

// Ids come from server config, but they are interpolated into inline script
// text, so restrict them to the characters real GA/Ads/Meta ids use.
function safeId(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "");
}

let loaded = false;

function loadTags(opts: { gaId: string; adsId: string; metaId: string; nonce: string }) {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const { nonce } = opts;
  const gaId = safeId(opts.gaId);
  const adsId = safeId(opts.adsId);
  const metaId = safeId(opts.metaId);

  if (gaId || adsId) {
    const tagId = gaId || adsId;
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
    loader.nonce = nonce;
    document.head.appendChild(loader);

    const init = document.createElement("script");
    init.nonce = nonce;
    init.textContent =
      `window.dataLayer=window.dataLayer||[];` +
      `function gtag(){dataLayer.push(arguments);}` +
      `gtag('js',new Date());` +
      (gaId ? `gtag('config','${gaId}');` : "") +
      (adsId ? `gtag('config','${adsId}');` : "");
    document.head.appendChild(init);
  }

  if (metaId) {
    const fb = document.createElement("script");
    fb.nonce = nonce;
    fb.textContent =
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){` +
      `n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};` +
      `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];` +
      `t=b.createElement(e);t.async=!0;t.src=v;t.nonce='${nonce}';` +
      `s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
      `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
      `fbq('init','${metaId}');fbq('track','PageView');`;
    document.head.appendChild(fb);
  }
}

function read(): Decision | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function write(decision: Decision) {
  try {
    localStorage.setItem(STORAGE_KEY, decision);
  } catch {
    /* private mode — the choice just isn't remembered */
  }
}

export interface ConsentStrings {
  message: string;
  accept: string;
  refuse: string;
  learnMore: string;
}

export function ConsentAnalytics({
  gaId,
  adsId,
  metaId,
  nonce,
  privacyHref,
  t,
}: {
  gaId: string;
  adsId: string;
  metaId: string;
  nonce: string;
  privacyHref: string;
  t: ConsentStrings;
}) {
  // Nothing to consent to if no tag is configured (dev, preview).
  const hasTags = Boolean(gaId || adsId || metaId);
  // One state object so the after-mount read of stored consent is a single
  // update. localStorage is client-only, so the decision cannot be known until
  // the component has mounted — hence `ready` gates the first paint.
  const [state, setState] = useState<{ ready: boolean; decision: Decision | null }>({
    ready: false,
    decision: null,
  });

  useEffect(() => {
    const current = read();
    if (current === "granted" && hasTags) {
      loadTags({ gaId, adsId, metaId, nonce });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time client-only read of stored consent after mount
    setState({ ready: true, decision: current });
  }, [gaId, adsId, metaId, nonce, hasTags]);

  if (!hasTags || !state.ready || state.decision !== null) return null;

  function choose(next: Decision) {
    write(next);
    setState({ ready: true, decision: next });
    if (next === "granted") loadTags({ gaId, adsId, metaId, nonce });
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.message}
      style={{
        position: "fixed",
        left: "16px",
        right: "16px",
        bottom: "16px",
        zIndex: 60,
        margin: "0 auto",
        maxWidth: "640px",
        background: "var(--surface-card, #fff)",
        color: "var(--text-body, #1a2230)",
        border: "1px solid var(--border-subtle, #e2ecec)",
        borderRadius: "16px",
        boxShadow: "0 12px 40px rgba(16,36,48,.16)",
        padding: "18px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px 16px",
        fontSize: "13.5px",
        lineHeight: 1.55,
      }}
    >
      <p style={{ margin: 0, flex: "1 1 260px", color: "var(--text-muted, #4c5663)" }}>
        {t.message}{" "}
        <Link
          href={privacyHref}
          style={{ color: "var(--brand, #1b6e7e)", fontWeight: 600, textDecoration: "underline" }}
        >
          {t.learnMore}
        </Link>
      </p>

      <div style={{ display: "flex", gap: "10px", flex: "0 0 auto" }}>
        <button
          type="button"
          onClick={() => choose("denied")}
          style={{
            appearance: "none",
            cursor: "pointer",
            border: "1px solid var(--border-subtle, #e2ecec)",
            background: "transparent",
            color: "var(--text-body, #1a2230)",
            borderRadius: "10px",
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {t.refuse}
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          style={{
            appearance: "none",
            cursor: "pointer",
            border: "none",
            background: "var(--brand, #1b6e7e)",
            color: "#fff",
            borderRadius: "10px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}
