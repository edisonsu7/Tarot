"use client";

import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import type { TarotCard } from "@/lib/dailyDrawHelpers";

/** 分享图扫码落地页（与线上站点一致） */
const SHARE_SITE_URL = "https://tarot-6fsx.vercel.app/";

/** 336×448 基础上再缩小约 15%（×0.85）；牌图放大占比，突出主视觉 */
const CARD_OUTER_W = 286;
const CARD_OUTER_H = 381;

const QR_DISPLAY_PX = 48;
const CARD_IMG_W = 100;
const CARD_IMG_H = 150;

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
    const rawQ = question?.trim();
    const displayQuestion =
      rawQ && rawQ.length > 52 ? `${rawQ.slice(0, 52)}…` : rawQ;

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      void QRCode.toDataURL(SHARE_SITE_URL, {
        width: QR_DISPLAY_PX,
        margin: 1,
        color: {
          dark: "#3d2a1a",
          light: "#faf8f3",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => {
          if (!cancelled) setQrDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setQrDataUrl(null);
        });
      return () => {
        cancelled = true;
      };
    }, []);

    return (
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: CARD_OUTER_W,
          height: CARD_OUTER_H,
          backgroundColor: "#faf8f3",
          background: "#faf8f3",
          borderRadius: 12,
          padding: "14px 16px 10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily:
            "'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif",
          boxSizing: "border-box",
          overflow: "hidden",
          border: "1px solid rgba(150, 120, 80, 0.32)",
        }}
      >
        {/* Header */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 9, color: "#a08060", letterSpacing: 0.6, fontWeight: 500 }}>
            牌语 TAROT
          </span>
          <span style={{ fontSize: 9, color: "#a08060", letterSpacing: 0.2 }}>{modeTitle}</span>
        </div>

        {/* Optional question (ask) */}
        {displayQuestion ? (
          <div
            style={{
              width: "100%",
              marginBottom: 8,
              padding: "5px 8px",
              background: "rgba(150, 120, 80, 0.08)",
              borderRadius: 6,
              borderLeft: "2px solid rgba(150, 120, 80, 0.5)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 10,
                color: "#6b5040",
                lineHeight: 1.5,
                fontWeight: 400,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              我的问题：{displayQuestion}
            </p>
          </div>
        ) : null}

        {/* Card image — 主视觉，略小于上一版 */}
        <div
          style={{
            width: CARD_IMG_W,
            height: CARD_IMG_H,
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid rgba(150, 120, 80, 0.25)",
            marginBottom: 5,
            flexShrink: 0,
            background: "#efe6d8",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faceSrc}
            alt={card.nameCn}
            width={CARD_IMG_W}
            height={CARD_IMG_H}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        {/* Card name */}
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#3d2a1a",
            lineHeight: 1.28,
            textAlign: "center",
          }}
        >
          {card.nameCn}
          <span style={{ fontSize: 11, fontWeight: 500, color: "#7a5c3a", marginLeft: 3 }}>
            {posLabel}
          </span>
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 9, color: "#a08060", letterSpacing: 0.2 }}>
          {card.nameEn}
        </p>

        {/* Keywords */}
        {keywords.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: 3,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 5,
            }}
          >
            {keywords.map((k) => (
              <span
                key={k}
                style={{
                  padding: "1px 6px",
                  borderRadius: 999,
                  border: "1px solid rgba(150, 120, 80, 0.35)",
                  fontSize: 8,
                  color: "#7a5c3a",
                  background: "rgba(150, 120, 80, 0.07)",
                  whiteSpace: "nowrap",
                }}
              >
                {k}
              </span>
            ))}
          </div>
        ) : null}

        {/* Divider */}
        <div
          style={{
            width: 20,
            height: 1,
            background: "rgba(150, 120, 80, 0.3)",
            margin: "5px auto 3px",
            flexShrink: 0,
          }}
        />

        {/* One sentence */}
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "#4a3520",
            lineHeight: 1.5,
            textAlign: "center",
            padding: "0 3px",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flexShrink: 0,
            maxHeight: 50,
          }}
        >
          {oneSentence}
        </p>

        {/* 底部：品牌 + 二维码 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: "auto",
            paddingTop: 5,
            gap: 5,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 7,
              color: "#a08060",
              lineHeight: 1.35,
              letterSpacing: 0.1,
              fontWeight: 400,
              maxWidth: "54%",
              alignSelf: "flex-end",
            }}
          >
            牌语 Tarot · 抽一张属于今天的牌
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                width={QR_DISPLAY_PX}
                height={QR_DISPLAY_PX}
                alt=""
                style={{
                  display: "block",
                  borderRadius: 3,
                  border: "1px solid rgba(150, 120, 80, 0.18)",
                }}
              />
            ) : (
              <div
                style={{
                  width: QR_DISPLAY_PX,
                  height: QR_DISPLAY_PX,
                  borderRadius: 3,
                  background: "#efe6d8",
                  border: "1px solid rgba(150, 120, 80, 0.15)",
                }}
              />
            )}
            <span
              style={{
                marginTop: 2,
                fontSize: 7,
                color: "#a08060",
                fontWeight: 400,
                letterSpacing: 0.02,
              }}
            >
              扫码抽一张
            </span>
          </div>
        </div>
      </div>
    );
  }
);
