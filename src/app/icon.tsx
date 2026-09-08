import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Browser-tab icon: the wordmark's gold rule over the petrol ground, which is
 * the only part of the brand that reads at 32 pixels.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b2030",
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.02em",
          borderRadius: 6,
        }}
      >
        <span style={{ color: "#c4a265", marginRight: 2 }}>|</span>F
      </div>
    ),
    size,
  );
}
