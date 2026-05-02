"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cardMeaningPagePath } from "@/lib/cardMeaningDetail";
import { getMeaning } from "@/lib/fortune";
import { withCardFallback } from "@/lib/dailyDrawHelpers";
import {
  remindText,
  tryItems,
  avoidItems,
  oneLineSummary,
} from "@/lib/askReadingHelpers";
import cards from "@/data/cards.json";
import type { TarotCard } from "@/lib/dailyDrawHelpers";
import type { AskResult } from "@/components/AskDrawPick";
import type { ApiReading } from "@/app/api/reading/route";
import { ResultActions } from "@/components/ResultActions";

const ASK_RESULT_KEY = "tarot_ask_result";
const NO_QUESTION = "无具体问题";

type ApiState = ApiReading | "loading" | "error" | null;

function isApiReading(s: ApiState): s is ApiReading {
  return typeof s === "object" && s !== null;
}

export function AskResultView() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [ready, setReady] = useState(false);
  const [card, setCard] = useState<TarotCard | null>(null);
  const [result, setResult] = useState<AskResult | null>(null);
  const [apiState, setApiState] = useState<ApiState>(null);

  // Step 1: read localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ASK_RESULT_KEY);
      if (!raw) { router.replace("/ask"); return; }
      const parsed = JSON.parse(raw) as AskResult;
      if (!parsed.cardId || !parsed.orientation) { router.replace("/ask"); return; }
      const found = (cards as TarotCard[]).find((c) => c.id === parsed.cardId);
      if (!found) { router.replace("/ask"); return; }
      setCard(found);
      setResult(parsed);
      setReady(true);
    } catch {
      router.replace("/ask");
    }
  }, [router]);

  // Step 2: call API if user wrote a question
  useEffect(() => {
    if (!ready || !card || !result) return;
    const rawQ = result.question ?? "";
    if (!rawQ || rawQ === NO_QUESTION || !rawQ.trim()) return;

    const isRev = result.orientation === "reversed";
    setApiState("loading");

    const controller = new AbortController();

    fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: rawQ,
        card: {
          nameZh: card.nameCn,
          nameEn: card.nameEn,
          orientation: isRev ? "reversed" : "upright",
          orientationZh: isRev ? "逆位" : "正位",
          keywords: (card.keywords ?? []).slice(0, 5),
        },
        mode: "ask",
      }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiReading>;
      })
      .then((data) => {
        if (data.mainReading && Array.isArray(data.tryList) && Array.isArray(data.avoidList) && data.oneSentence) {
          setApiState(data);
        } else {
          throw new Error("Incomplete response");
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("[AskResultView] /api/reading error:", err);
        setApiState("error");
      });

    return () => controller.abort();
  }, [ready, card, result]);

  if (!ready || !card || !result) {
    return <div className="daily-rv2-loading"><span>载入中…</span></div>;
  }

  const isReversed = result.orientation === "reversed";
  const posLabel = isReversed ? "逆位" : "正位";
  const keywords = (card.keywords ?? []).slice(0, 5);
  const meaning = getMeaning(card, isReversed);

  const rawQuestion = result.question ?? "";
  const hasQuestion = rawQuestion !== NO_QUESTION && rawQuestion.trim() !== "";
  const questionDisplay =
    hasQuestion && rawQuestion.length > 60
      ? `${rawQuestion.slice(0, 60)}…`
      : rawQuestion;

  const apiData = isApiReading(apiState) ? apiState : null;
  const isLoadingApi = hasQuestion && (apiState === null || apiState === "loading");
  const showFallbackNote = hasQuestion && apiState === "error";

  // Local fallback (always computed, used when no API data)
  const q = hasQuestion && !apiData ? rawQuestion : undefined;
  const remind = remindText(card, isReversed, q);
  const tryList = tryItems(card, isReversed, q);
  const avoidList = avoidItems(card, isReversed, q);
  const summary = oneLineSummary(card, isReversed, q);

  function buildCopyText() {
    if (!card || !result) return "";
    const lines: string[] = [];
    if (hasQuestion) lines.push(`问题：${rawQuestion}`, ``);
    lines.push(`${card.nameCn}（${posLabel}） / ${card.nameEn}`);
    lines.push(`关键词：${keywords.join("、") || "-"}`);
    lines.push(``);
    if (apiData) {
      lines.push(apiData.mainReading, ``, `一句话回应：${apiData.oneSentence}`);
    } else {
      lines.push(`牌义：${meaning || "-"}`, ``);
      lines.push(hasQuestion ? `针对这个问题的提醒：${remind}` : `提醒：${remind}`);
      lines.push(hasQuestion ? `一句话回应：${summary}` : `一句话总结：${summary}`);
    }
    return lines.join("\n").trim();
  }

  function handleAskAgain() {
    try { localStorage.removeItem(ASK_RESULT_KEY); } catch {}
    router.push("/ask");
  }

  return (
    <div className="result-page-wrap">
      {/* 问题块 */}
      {hasQuestion ? (
        <div className="reading-panel reading-panel--question">
          <p className="reading-panel-label">你的问题</p>
          <p className="reading-panel-body reading-panel-body--question">{questionDisplay}</p>
        </div>
      ) : (
        <div className="reading-panel reading-panel--no-question">
          <p className="reading-panel-body reading-panel-body--muted">
            没有具体问题时，这张牌更像是一段今日提醒。
          </p>
        </div>
      )}

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
          <p className="daily-rv2-label">
            {hasQuestion
              ? (apiData ? apiData.cardResponseTitle : "塔罗对这个问题的回应")
              : "灵感问牌（随意抽）"}
          </p>
          <h1 className="daily-rv2-name">{card.nameCn}（{posLabel}）</h1>
          <p className="daily-rv2-name-en">{card.nameEn}</p>
        </div>
      </div>

      {/* 关键词 */}
      {keywords.length > 0 && (
        <div className="daily-rv2-keywords">
          {keywords.map((k) => (
            <span key={k} className="draw-kw-chip">{k}</span>
          ))}
        </div>
      )}

      {/* fallback 提示 */}
      {showFallbackNote && (
        <p className="ask-result-fallback-note">当前使用本地解读结果。</p>
      )}

      {/* 内容区块 */}
      {isLoadingApi ? (
        <div className="reading-panel reading-panel--loading">
          <p className="reading-panel-body reading-panel-body--muted">
            正在为你的问题整理牌面回应……
          </p>
        </div>
      ) : apiData ? (
        /* API 返回内容 */
        <>
          <div className="reading-panel">
            <p className="reading-panel-label">针对这个问题的提醒</p>
            <p className="reading-panel-body">{apiData.mainReading}</p>
          </div>

          <div className="reading-panel">
            <p className="reading-panel-label">关于这件事，可以尝试</p>
            <ul className="reading-panel-list">
              {apiData.tryList.map((item, i) => (
                <li key={i} className="reading-panel-body">{item}</li>
              ))}
            </ul>
          </div>

          <div className="reading-panel">
            <p className="reading-panel-label">关于这件事，需要避免</p>
            <ul className="reading-panel-list">
              {apiData.avoidList.map((item, i) => (
                <li key={i} className="reading-panel-body">{item}</li>
              ))}
            </ul>
          </div>

          <div className="reading-panel reading-panel--summary">
            <p className="reading-panel-label">一句话回应</p>
            <p className="reading-panel-body reading-panel-body--summary">{apiData.oneSentence}</p>
          </div>
        </>
      ) : (
        /* 本地模板内容（无问题 or API 失败 fallback） */
        <>
          <div className="reading-panel">
            <p className="reading-panel-label">{posLabel}牌义</p>
            <p className="reading-panel-body">{meaning}</p>
          </div>

          <div className="reading-panel">
            <p className="reading-panel-label">
              {hasQuestion ? "针对这个问题的提醒" : "现在的提醒"}
            </p>
            <p className="reading-panel-body">{remind}</p>
          </div>

          <div className="reading-panel">
            <p className="reading-panel-label">
              {hasQuestion ? "关于这件事，可以尝试" : "可以尝试"}
            </p>
            <ul className="reading-panel-list">
              {tryList.map((item, i) => (
                <li key={i} className="reading-panel-body">{item}</li>
              ))}
            </ul>
          </div>

          <div className="reading-panel">
            <p className="reading-panel-label">
              {hasQuestion ? "关于这件事，需要避免" : "需要避免"}
            </p>
            <ul className="reading-panel-list">
              {avoidList.map((item, i) => (
                <li key={i} className="reading-panel-body">{item}</li>
              ))}
            </ul>
          </div>

          <div className="reading-panel reading-panel--summary">
            <p className="reading-panel-label">
              {hasQuestion ? "一句话回应" : "一句话总结"}
            </p>
            <p className="reading-panel-body reading-panel-body--summary">{summary}</p>
          </div>
        </>
      )}

      {/* 操作区 */}
      <ResultActions
        shareLabel={isLoadingApi ? "解读中…" : "分享问牌结果"}
        shareCardData={{ card, isReversed, mode: "ask", question: hasQuestion ? rawQuestion : undefined, oneSentence: apiData ? apiData.oneSentence : summary }}
        shareFallbackText={buildCopyText()}
        shareDisabled={isLoadingApi}
        detailHref={cardMeaningPagePath(card.id, isReversed, { from: pathname })}
        retryLabel="再问一次"
        onRetry={handleAskAgain}
      />
    </div>
  );
}
