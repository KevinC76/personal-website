import { ImageResponse } from "next/og";
import { getPublished } from "@/lib/content/public";
export const alt = "Kevin Chiputra Newspaper";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  const { document: c } = await getPublished();
  return new ImageResponse(
    <div
      style={{
        background: "#fcf9f2",
        color: "#111",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 64,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 24,
          borderBottom: "4px solid #111",
          paddingBottom: 24,
          textTransform: "uppercase",
          letterSpacing: 4,
        }}
      >
        {c.brand.name}
      </div>
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "center",
          fontSize: 90,
          fontFamily: "serif",
          fontStyle: "italic",
          lineHeight: 1.1,
        }}
      >
        {c.profile.name}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 28,
          borderTop: "2px solid #111",
          paddingTop: 24,
        }}
      >
        {c.profile.role}
      </div>
    </div>,
    size,
  );
}
