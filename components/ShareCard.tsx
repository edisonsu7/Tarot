"use client";

import { forwardRef } from "react";
import type { TarotCard } from "@/lib/dailyDrawHelpers";

export type ShareCardProps = {
  card: TarotCard;
  isReversed: boolean;
  mode: "daily" | "ask";
  question?: string;
  oneSentence: string;
  /** 已解析的牌面图 URL（.jpg 或 .svg）；缺省时用 .svg，避免仅传数据时 404 */
  cardImageSrc?: string;
};

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ card, isReversed, mode, question, oneSentence, cardImageSrc }, ref) {
    const faceSrc = cardImageSrc ?? `/cards/${card.id}.svg`;
    const posLabel = isReversed ? "逆位" : "正位";
    const modeTitle = mode === "daily" ? "今日指引" : "灵感问牌";
    const keywords = (card.keywords ?? []).slice(0, 4);
    const displayQuestion =
      question && question.length > 40 ? `${question.slice(0, 40)}…` : question;

    return (
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: 600,
          height: 800,
          backgroundColor: "#faf8f3",
          background: "#faf8f3",
          borderRadius: 24,
          padding: "48px 48px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily:
            "'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
          border: "2px solid rgba(150, 120, 80, 0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 13, color: "#a08060", letterSpacing: 2, fontWeight: 500 }}>
            牌语 TAROT
          </span>
          <span style={{ fontSize: 13, color: "#a08060", letterSpacing: 1 }}>{modeTitle}</span>
        </div>

        {/* Optional question (ask) */}
        {displayQuestion && (
          <div
            style={{
              width: "100%",
              marginBottom: 24,
              padding: "12px 18px",
              background: "rgba(150, 120, 80, 0.08)",
              borderRadius: 12,
              borderLeft: "3px solid rgba(150, 120, 80, 0.5)",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: "#6b5040", lineHeight: 1.6, fontWeight: 400 }}>
              我的问题：{displayQuestion}
            </p>
          </div>
        )}

        {/* Card image — 同站资源不要 crossOrigin，避免无 CORS 头时污染 canvas */}
        <div
          style={{
            width: 140,
            height: 210,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(150, 120, 80, 0.25)",
            marginBottom: 24,
            flexShrink: 0,
            background: "#efe6d8",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faceSrc}
            alt={card.nameCn}
            width={140}
            height={210}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        {/* Card name */}
        <p
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 700,
            color: "#3d2a1a",
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          {card.nameCn}
          <span style={{ fontSize: 18, fontWeight: 500, color: "#7a5c3a", marginLeft: 8 }}>
            {posLabel}
          </span>
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#a08060", letterSpacing: 1 }}>
          {card.nameEn}
        </p>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 16,
            }}
          >
            {keywords.map((k) => (
              <span
                key={k}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(150, 120, 80, 0.35)",
                  fontSize: 12,
                  color: "#7a5c3a",
                  background: "rgba(150, 120, 80, 0.07)",
                  whiteSpace: "nowrap",
                }}
              >
                {k}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            width: 40,
            height: 1,
            background: "rgba(150, 120, 80, 0.3)",
            margin: "24px auto",
            flexShrink: 0,
          }}
        />

        {/* One sentence */}
        <p
          style={{
            margin: 0,
            fontSize: 16,
            color: "#4a3520",
            lineHeight: 1.75,
            textAlign: "center",
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
          }}
        >
          {oneSentence}
        </p>

        {/* Footer */}
        <p
          style={{
            margin: "24px 0 0",
            fontSize: 12,
            color: "#b09070",
            letterSpacing: 1.5,
            flexShrink: 0,
          }}
        >
          牌语 Tarot · {modeTitle}
        </p>
      </div>
    );
  }
);
