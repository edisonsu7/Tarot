"use client";

import { useMemo, useState } from "react";
import cards from "@/data/cards.json";

type TarotCard = (typeof cards)[number];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function suitLabel(suit: TarotCard["suit"]) {
  switch (suit) {
    case "major":
      return "大阿卡那";
    case "wands":
      return "权杖";
    case "cups":
      return "圣杯";
    case "swords":
      return "宝剑";
    case "pentacles":
      return "星币";
    default:
      return suit;
  }
}

export function CardsMiniGallery() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const nq = normalize(q);
    const list = (cards as TarotCard[]).filter((c) => {
      if (!nq) return true;
      const hay = normalize([c.id, c.nameCn, c.nameEn, c.suit, ...(c.keywords ?? [])].join(" "));
      return hay.includes(nq);
    });
    return list.slice(0, 40);
  }, [q]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>牌库搜索</div>
          <div style={{ fontSize: 12, color: "rgba(199,210,254,0.75)" }}>支持中/英文名、关键词、花色。最多展示前 40 条。</div>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例如：愚人 / The Fool / 开始 / cups"
          style={{
            height: 40,
            width: 320,
            maxWidth: "100%",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            padding: "0 12px",
            color: "rgba(238,242,255,0.92)",
            outline: "none"
          }}
        />
      </div>

      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr 1.2fr", gap: 0, padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(199,210,254,0.75)" }}>
          <div>中文名</div>
          <div>英文名</div>
          <div>花色</div>
          <div>关键词</div>
        </div>
        {filtered.map((c) => (
          <div
            key={c.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 0.8fr 1.2fr",
              gap: 0,
              padding: 12,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: 13,
              color: "rgba(238,242,255,0.88)"
            }}
          >
            <div style={{ fontWeight: 800 }}>{c.nameCn}</div>
            <div style={{ color: "rgba(199,210,254,0.80)" }}>{c.nameEn}</div>
            <div style={{ color: "rgba(199,210,254,0.80)" }}>{suitLabel(c.suit)}</div>
            <div style={{ color: "rgba(199,210,254,0.80)" }}>{(c.keywords ?? []).slice(0, 4).join(" / ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

