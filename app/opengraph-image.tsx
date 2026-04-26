import { ImageResponse } from "next/og";
import { getTodayFortune } from "@/lib/fortune";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  const fortune = getTodayFortune({ timeZone: "Asia/Shanghai", enableReversed: true });
  const title = `${fortune.card.nameCn}${fortune.isReversed ? "（逆位）" : "（正位）"}`;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const cardImageUrl = `${base}/cards/${fortune.card.id}.jpg`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          padding: 64,
          background: "radial-gradient(900px 600px at 20% 10%, #1f1147 0%, #0b1020 45%, #060814 100%)",
          color: "#eef2ff"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 24, opacity: 0.8 }}>牌语 Tarot · {fortune.dateKey}</div>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>{title}</div>
            <div style={{ fontSize: 30, opacity: 0.85 }}>{fortune.card.nameEn}</div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {fortune.card.keywords.slice(0, 4).map((k) => (
              <div
                key={k}
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  fontSize: 22
                }}
              >
                {k}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: 340,
            height: 502,
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.2)",
            marginLeft: 48
          }}
        >
          <img
            src={cardImageUrl}
            width={340}
            height={502}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    ),
    size
  );
}

