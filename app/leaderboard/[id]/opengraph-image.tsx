import { ImageResponse } from "next/og";

import { getGuildInfo } from "@/lib/discord";
import { getSiteHost } from "@/lib/site";
import { isSnowflake } from "@/lib/validation";

export const alt = "Amari Leaderboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const siteHost = getSiteHost();

export default async function LeaderboardImage({
  params,
}: {
  params: { id: string };
}) {
  const info = isSnowflake(params.id)
    ? await getGuildInfo(params.id).catch(() => null)
    : null;
  const name = info?.name ?? "Discord Server";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(circle at 20% 0%, #232a56 0%, #0b0e14 55%, #0b0e14 100%)",
          color: "#f2f4f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 5,
              paddingBottom: 13,
              background: "linear-gradient(135deg, #353d76, #171b2c)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ width: 7, height: 16, borderRadius: 4, background: "#9aa4ff" }} />
            <div style={{ width: 7, height: 25, borderRadius: 4, background: "#5865f2" }} />
            <div style={{ width: 7, height: 12, borderRadius: 4, background: "#9d7bff" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 26, fontWeight: 700 }}>Amari Leaderboard</span>
            <span style={{ fontSize: 15, color: "#9aa3b2", letterSpacing: 2 }}>
              UNOFFICIAL VIEWER
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 22, color: "#9aa3b2" }}>
            All-time and weekly rankings
          </span>
          <span
            style={{
              fontSize: 74,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -3,
              maxWidth: 980,
            }}
          >
            {name}
          </span>
          <span style={{ fontSize: 26, color: "#b9c0ff" }}>
            See who&apos;s winning.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 24,
            fontSize: 18,
            color: "#9aa3b2",
          }}
        >
          <span>Levels · EXP · Weekly race</span>
          <span>{siteHost}</span>
        </div>
      </div>
    ),
    size
  );
}
