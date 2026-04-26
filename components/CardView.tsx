"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cardMeaningPagePath } from "@/lib/cardMeaningDetail";
import type { Fortune } from "@/lib/fortune";
import { getMeaning } from "@/lib/fortune";
import { bodyTextStyle, HOME_SURFACE, homeCardPadding, homeCardRadius, homeCardShadow, sectionHeadingStyle } from "@/components/homeLayout";

function fallbackSvgDataUrl(title: string) {
  const safe = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect x="36" y="36" width="648" height="1008" rx="42" fill="#0b1020" stroke="url(#g)" stroke-width="12"/>
  <circle cx="360" cy="390" r="140" fill="url(#g)" opacity="0.18"/>
  <path d="M360 250l32 64 70 10-51 48 12 70-63-34-63 34 12-70-51-48 70-10 32-64z" fill="url(#g)"/>
  <text x="360" y="780" font-family="ui-sans-serif, system-ui, -apple-system" font-size="44" fill="#eef2ff" text-anchor="middle">${safe}</text>
  <text x="360" y="840" font-family="ui-sans-serif, system-ui, -apple-system" font-size="24" fill="#c7d2fe" text-anchor="middle">请替换 public/cards/${safe}.jpg</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function withCardFallback(cardId: string, nameForFallback: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const stage = img.dataset.fallbackStage ?? "jpg";
    if (stage === "jpg") {
      img.dataset.fallbackStage = "svg";
      img.src = `/cards/${cardId}.svg`;
      return;
    }
    img.dataset.fallbackStage = "inline";
    img.src = fallbackSvgDataUrl(nameForFallback);
  };
}

export function CardView({ fortune }: { fortune: Fortune }) {
  const pathname = usePathname() ?? "";
  const { card, isReversed, dateKey } = fortune;
  const title = `${card.nameCn}${isReversed ? "（逆位）" : "（正位）"}`;
  const meaning = getMeaning(card, isReversed);

  const innerBox: CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.14)",
    padding: 16
  };

  return (
    <section
      className={`${HOME_SURFACE} flex flex-wrap`}
      style={{
        padding: homeCardPadding,
        borderRadius: homeCardRadius,
        boxShadow: homeCardShadow,
        gap: 24
      }}
    >
      <div className="min-w-0 flex-1 space-y-6" style={{ minWidth: "min(100%, 320px)" }}>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="mx-auto lg:mx-0">
            <img
              src={`/cards/${card.id}.jpg`}
              alt={`${card.nameCn}牌面`}
              width={170}
              height={255}
              style={{ width: 170, height: 255 }}
              className="block rounded-2xl border border-white/15 object-cover shadow-[0_20px_70px_-45px_rgba(129,140,248,0.9)]"
              data-fallback-stage="jpg"
              onError={withCardFallback(card.id, card.nameCn)}
            />
          </div>

          <div className="space-y-4 lg:border-l lg:border-white/10 lg:pl-6">
            <div className="space-y-2">
              <p style={{ ...bodyTextStyle, margin: 0, fontSize: 14, opacity: 0.75 }}>今日（{dateKey}）</p>
              <h2 style={{ ...sectionHeadingStyle, fontSize: 24 }}>{title}</h2>
              <p style={{ ...bodyTextStyle, margin: 0 }}>{card.nameEn}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {card.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-indigo-50/90"
                  style={{ fontSize: 14, lineHeight: 1.4 }}
                >
                  {k}
                </span>
              ))}
            </div>

            <div style={innerBox}>
              <p style={{ ...sectionHeadingStyle, fontSize: 15 }}>一句话解读</p>
              <p style={{ ...bodyTextStyle, margin: "10px 0 0" }}>{meaning}</p>
            </div>
          </div>
        </div>
      </div>

      <aside className="w-full space-y-3 sm:w-[420px] sm:flex-none sm:self-start" style={{ ...bodyTextStyle }}>
        <div className="flex items-center justify-between gap-3">
          <p style={{ ...sectionHeadingStyle, fontSize: 16, margin: 0 }}>解读</p>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>更适合当作“提示”</p>
        </div>
        <div className="grid gap-3">
            <div style={innerBox}>
              <p style={{ ...sectionHeadingStyle, fontSize: 15 }}>总体</p>
              <p style={{ ...bodyTextStyle, margin: "10px 0 0" }}>{meaning}</p>
              <p style={{ margin: "12px 0 0" }}>
                <Link href={cardMeaningPagePath(card.id, isReversed, { from: pathname })} className="draw-result-full-meaning-link">
                  完整牌义 →
                </Link>
              </p>
            </div>
          <div style={innerBox}>
            <p style={{ ...sectionHeadingStyle, fontSize: 15 }}>建议</p>
            <p style={{ ...bodyTextStyle, margin: "10px 0 0" }}>把今天的关键词挑一个当作行动提示：{card.keywords[0]}。</p>
          </div>
          <div style={innerBox}>
            <p style={{ ...sectionHeadingStyle, fontSize: 15 }}>感情</p>
            <p style={{ ...bodyTextStyle, margin: "10px 0 0" }}>先表达需求与边界，再谈期待；保持温和与清晰。</p>
          </div>
          <div style={innerBox}>
            <p style={{ ...sectionHeadingStyle, fontSize: 15 }}>事业/学业</p>
            <p style={{ ...bodyTextStyle, margin: "10px 0 0" }}>把目标拆成最小一步，今天只把这一步做完。</p>
          </div>
        </div>
      </aside>
    </section>
  );
}

