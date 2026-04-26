"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDateKeyInTimeZone } from "@/lib/dateKey";
import { cardMeaningPagePath, getMeaningPreview } from "@/lib/cardMeaningDetail";
import {
  formatTitle,
  getCardById,
  getMeaning,
  notSuitableText,
  oneLineConclusion,
  suitableText,
  withCardFallback
} from "@/lib/dailyDrawHelpers";
import { getDrawForDate, getOrCreateUserId } from "@/lib/drawStorage";

export function DailyResultView() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const timeZone = "Asia/Shanghai";
  const dateKey = useMemo(() => getDateKeyInTimeZone(new Date(), timeZone), []);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [card, setCard] = useState<ReturnType<typeof getCardById>>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [drawnAt, setDrawnAt] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateUserId();
    const d = getDrawForDate(dateKey);
    if (!d || "picks" in d) {
      router.replace("/daily");
      return;
    }
    const c = getCardById(d.cardId);
    if (!c) {
      router.replace("/daily");
      return;
    }
    setCard(c);
    setIsReversed(d.isReversed);
    setDrawnAt(d.drawnAt);
    setReady(true);
  }, [dateKey, router]);

  if (!ready || !card) {
    return (
      <div className="cream-inner-card cream-inner-card--flex" style={{ margin: "12px auto", maxWidth: 420, minHeight: 100 }}>
        <span style={{ color: "var(--cream-muted)" }}>载入中…</span>
      </div>
    );
  }

  return (
    <div key={card.id} className="mist daily-result-page-enter result-container">
      <div className="result-layout">
        <div className="draw-result-card-col" style={{ width: "100%", maxWidth: 280, display: "grid", gap: 10 }}>
          <img
            src={`/cards/${card.id}.jpg`}
            data-fallback-stage="jpg"
            onError={withCardFallback(card.id, card.nameCn)}
            alt={card.nameCn}
            width={280}
            height={420}
            className="rounded-2xl border"
            style={{
              borderColor: "var(--cream-line)",
              width: "100%",
              maxWidth: 280,
              height: "auto",
              aspectRatio: "2 / 3",
              objectFit: "cover",
              boxShadow: "var(--ui-glow-shadow)"
            }}
          />
        </div>

        <div className="draw-result-reveal-right" style={{ display: "grid", gap: 16, alignContent: "start", minWidth: 0 }}>
          <section className="cream-inner-card" style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "baseline", justifyContent: "space-between" }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--cream-ink)" }}>你今天抽到的牌</h1>
              <span className="cream-meaning-body" style={{ fontSize: 13, color: "var(--cream-muted)" }}>
                {dateKey}
              </span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--cream-muted)" }}>牌名</p>
              <p style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 800, color: "var(--cream-ink)" }}>{formatTitle(card, isReversed)}</p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--cream-muted)" }}>{card.nameEn}</p>
            </div>
          </section>

          <div style={{ display: "grid", gap: 12 }}>
            <div className="draw-result-interpret">
              <p className="draw-result-interpret__label">今日关键词</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(card.keywords ?? []).slice(0, 8).map((k) => (
                  <span key={k} className="draw-kw-chip">
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div className="draw-result-interpret">
              <p className="draw-result-interpret__label">一句话提醒</p>
              <p className="draw-result-interpret__text">{oneLineConclusion(card, isReversed)}</p>
            </div>
            <div className="draw-result-interpret">
              <p className="draw-result-interpret__label">今天适合做什么</p>
              <p className="draw-result-interpret__text">{suitableText(card)}</p>
            </div>
            <div className="draw-result-interpret">
              <p className="draw-result-interpret__label">今天需要避免什么</p>
              <p className="draw-result-interpret__text">{notSuitableText(card, isReversed)}</p>
            </div>
            <div className="draw-result-interpret">
              <p className="draw-result-interpret__label">完整牌义</p>
              <p className="draw-result-interpret__text">{getMeaningPreview(card, isReversed, 200)}</p>
              <Link href={cardMeaningPagePath(card.id, isReversed, { from: pathname })} className="draw-result-full-meaning-link">
                阅读完整牌义 →
              </Link>
            </div>
          </div>

          {drawnAt && <p style={{ margin: 0, fontSize: 13, color: "var(--cream-muted)" }}>记录时间 {new Date(drawnAt).toLocaleString("zh-CN")}</p>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "center" }}>
            <button
              type="button"
              className="btn-tarot-primary"
              style={{ padding: "10px 18px", fontSize: 14 }}
              onClick={async () => {
                try {
                  const lines: string[] = [];
                  lines.push(`${formatTitle(card, isReversed)} / ${card.nameEn}`);
                  lines.push(`关键词：${(card.keywords ?? []).slice(0, 8).join("、") || "-"}`);
                  lines.push(`一句话提醒：${oneLineConclusion(card, isReversed)}`);
                  lines.push(`今天适合：${suitableText(card)}`);
                  lines.push(`今天不适合：${notSuitableText(card, isReversed)}`);
                  lines.push(`牌义：${getMeaning(card, isReversed) || "-"}`);
                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  lines.push("");
                  lines.push(`深度牌义：${origin}${cardMeaningPagePath(card.id, isReversed, { from: pathname })}`);
                  await navigator.clipboard.writeText(lines.join("\n").trim());
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                } catch {}
              }}
            >
              {copied ? "已复制" : "复制全文"}
            </button>
            <Link href="/history" className="btn-tarot-secondary" style={{ padding: "10px 18px", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              查看记录 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
