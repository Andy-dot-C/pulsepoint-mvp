import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PulsePoint";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "linear-gradient(135deg, rgb(219,234,254) 0%, rgb(236,253,245) 45%, rgb(241,245,249) 100%)",
          color: "rgb(15,23,42)"
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 2, textTransform: "uppercase", color: "rgb(71,85,105)" }}>
          PulsePoint
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05 }}>Opinion Polls</div>
          <div style={{ fontSize: 34, color: "rgb(51,65,85)" }}>Fast voting. Anonymous voice. Real-time sentiment.</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
