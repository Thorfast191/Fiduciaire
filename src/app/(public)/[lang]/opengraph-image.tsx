import { ImageResponse } from "next/og";
import { getMessages } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Fiduvia — fiduciaire en ligne, Vaud · Valais · Fribourg";

/**
 * The card shown when the site is shared — WhatsApp, LinkedIn, Slack.
 *
 * Generated rather than a static asset so it stays in the site's own palette
 * and picks up the headline from the message bundle; a business link with no
 * preview reads as broken, which is the worst first impression a fiduciary
 * can make on a referral.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getMessages(isLocale(lang) ? lang : "fr");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf7f0",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 6, height: 46, background: "#c4a265" }} />
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "#0b2030",
            }}
          >
            FIDUVIA
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "#0b2030",
            maxWidth: 940,
          }}
        >
          {t.hero.title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 26,
            color: "#1b6e7e",
            letterSpacing: "0.06em",
          }}
        >
          {t.hero.eyebrow}
        </div>
      </div>
    ),
    size,
  );
}
