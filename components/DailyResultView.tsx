"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDateKeyInTimeZone } from "@/lib/dateKey";
import { cardMeaningPagePath } from "@/lib/cardMeaningDetail";
import {
  formatTitle,
  getCardById,
  getMeaning,
  notSuitableText,
  oneLineConclusion,
  suitableText,
  withCardFallback,
} from "@/lib/dailyDrawHelpers";
import { getDrawForDate, getOrCreateUserId } from "@/lib/drawStorage";
import { ResultActions } from "@/components/ResultActions";

export function DailyResultView() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const dateKey = useMemo(() => getDateKeyInTimeZone(new Date(), "Asia/Shanghai"), []);
  const [ready, setReady] = useState(false);
  const [card, setCard] = useState<ReturnType<typeof getCardById>>(null);
  const [isReversed, setIsReversed] = useState(false);

  useEffect(() => {
    getOrCreateUserId();
    const d = getDrawForDate(dateKey);
    if (!d || "picks" in d) { router.replace("/daily"); return; }
    const c = getCardById(d.cardId);
    if (!c) { router.replace("/daily"); return; }
    setCard(c);
    setIsReversed(d.isReversed);
    setReady(true);
  }, [dateKey, router]);

  if (!ready || !card) {
    return <div className="daily-rv2-loading"><span>载入中…</span></div>;
  }

  const posLabel = isReversed ? "逆位" : "正位";

  function buildCopyText() {
    if (!card) return "";
    return [
      `${formatTitle(card, isReversed)} / ${card.nameEn}`,
      `关键词：${(card.keywords ?? []).slice(0, 5).join("、") || "-"}`,
      `今日提醒：${oneLineConclusion(card, isReversed)}`,
      `适合：${suitableText(card)}`,
      `不适合：${notSuitableText(card, isReversed)}`,
      `${posLabel}牌义：${getMeaning(card, isReversed) || "-"}`,
    ].join("\n").trim();
  }

  return (
    <div className="result-page-wrap">
      {/* 牌头 */}
      <div className="daily-rv2-header">
        <img
          src={`/cards/${card.id}.jpg`}
          data-fallback-stage="jpg"
          onError={withCardFallback(card.id, card.nameCn)}
          alt={card.nameCn}
          width={56}
          height={84}
          className="daily-rv2-thumb"
        />
        <div className="daily-rv2-title-col">
          <p className="daily-rv2-label">今日指引</p>
          <h1 className="daily-rv2-name">{formatTitle(card, isReversed)}</h1>
          <p className="daily-rv2-name-en">{card.nameEn}</p>
        </div>
      </div>

      {/* 关键词 */}
      <div className="daily-rv2-keywords">
        {(card.keywords ?? []).slice(0, 5).map((k) => (
          <span key={k} className="draw-kw-chip">{k}</span>
        ))}
      </div>

      {/* 内容区块：统一 reading-panel */}
      <div className="reading-panel">
        <p className="reading-panel-label">今日提醒</p>
        <p className="reading-panel-body">{oneLineConclusion(card, isReversed)}</p>
      </div>

      <div className="reading-panel">
        <p className="reading-panel-label">适合</p>
        <p className="reading-panel-body">{suitableText(card)}</p>
      </div>

      <div className="reading-panel">
        <p className="reading-panel-label">不适合</p>
        <p className="reading-panel-body">{notSuitableText(card, isReversed)}</p>
      </div>

      <div className="reading-panel">
        <p className="reading-panel-label">{posLabel}牌义</p>
        <p className="reading-panel-body">{getMeaning(card, isReversed)}</p>
      </div>

      {/* 操作区 */}
      <ResultActions
        shareLabel="分享今日牌卡"
        shareCardData={{ card, isReversed, mode: "daily", oneSentence: oneLineConclusion(card, isReversed) }}
        shareFallbackText={buildCopyText()}
        detailHref={cardMeaningPagePath(card.id, isReversed, { from: pathname })}
        retryLabel="再抽一次"
        retryHref="/daily"
      />
    </div>
  );
}
