"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import cards from "@/data/cards.json";
import { getDateKeyInTimeZone } from "@/lib/dateKey";
import { cardMeaningPagePath } from "@/lib/cardMeaningDetail";
import { clearDrawForDate, getDrawForDate, getOrCreateUserId, saveDrawForDate, type StoredDraw } from "@/lib/drawStorage";
import { getMeaning } from "@/lib/fortune";

type TarotCard = (typeof cards)[number];

type Phase = "idle" | "shuffling" | "pick" | "revealed" | "locked";

function randInt(maxExclusive: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
}

function randBool() {
  return randInt(2) === 0;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(!!mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

function getCardById(id: string): TarotCard | null {
  return (cards as TarotCard[]).find((c) => c.id === id) ?? null;
}

function formatTitle(card: TarotCard, isReversed: boolean) {
  return `${card.nameCn}${isReversed ? "（逆位）" : "（正位）"}`;
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
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080"><rect x="36" y="36" width="648" height="1008" rx="44" fill="#0b1020" stroke="#818cf8" stroke-width="10"/><text x="360" y="560" font-family="ui-sans-serif,system-ui,-apple-system" font-size="44" fill="#eef2ff" text-anchor="middle">${nameForFallback}</text></svg>`
    )}`;
  };
}

export function DrawDeck() {
  const pathname = usePathname() ?? "";
  const timeZone = "Asia/Shanghai";
  const reducedMotion = usePrefersReducedMotion();

  const dateKey = useMemo(() => getDateKeyInTimeZone(new Date(), timeZone), []);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stored, setStored] = useState<StoredDraw | null>(null);
  const [picked, setPicked] = useState<{ card: TarotCard; isReversed: boolean } | null>(null);

  const [shuffleSeed, setShuffleSeed] = useState(0);
  const cardsInDeck = 9;
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [pickRotated, setPickRotated] = useState(false);
  const [deckCardW, setDeckCardW] = useState(72);
  const deckCardH = Math.round(deckCardW * (102 / 72));
  const deckScale = deckCardW / 72;
  const resultCardW = Math.round(deckCardW * 2);
  const resultCardH = Math.round(resultCardW * (3 / 2));

  useEffect(() => {
    // Establish user identity once; per-user-per-day is localStorage scoped.
    getOrCreateUserId();

    const d = getDrawForDate(dateKey);
    if (d && !("picks" in d)) {
      const card = getCardById(d.cardId);
      if (card) {
        setStored(d);
        setPicked({ card, isReversed: d.isReversed });
        // When restoring an existing draw, show the face immediately.
        setPickRotated(true);
        setPhase("locked");
        return;
      }
    }
    setPhase("idle");
  }, [dateKey]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("tarot:deckCardW");
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n)) setDeckCardW(Math.min(140, Math.max(56, Math.round(n))));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("tarot:deckCardW", String(deckCardW));
    } catch {
      // ignore
    }
  }, [deckCardW]);

  function startShuffle() {
    if (phase !== "idle") return;
    setPhase("shuffling");
    setShuffleSeed((n) => n + 1);
    const delay = reducedMotion ? 0 : 900;
    window.setTimeout(() => setPhase("pick"), delay);
  }

  function pickOne(index: number) {
    if (phase !== "pick") return;
    setPickedIndex(index);

    const card = cards[randInt(cards.length)]!;
    const isReversed = randBool();
    const draw: StoredDraw = {
      cardId: card.id,
      isReversed,
      drawnAt: new Date().toISOString()
    };
    saveDrawForDate(dateKey, draw);
    setStored(draw);
    setPicked({ card, isReversed });

    // reveal: rotate card first, then lock
    setPhase("revealed");
    setPickRotated(false);
    const flipDelay = reducedMotion ? 0 : 140;
    const lockDelay = reducedMotion ? 0 : 520;
    window.setTimeout(() => setPickRotated(true), flipDelay);
    window.setTimeout(() => setPhase("locked"), lockDelay);
  }

  const header =
    phase === "locked"
      ? "你今天已经抽过了"
      : phase === "pick"
        ? "请选择一张牌"
        : "准备好了吗？";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-indigo-50/90">{header}</p>
          <p className="text-xs text-indigo-100/60">
            测试模式：可反复抽牌（{dateKey}，{timeZone}）。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {phase === "idle" && (
            <button
              type="button"
              onClick={startShuffle}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10 transition hover:bg-indigo-400"
            >
              开始抽牌
            </button>
          )}
          {(phase === "locked" || phase === "revealed") && (
            <button
              type="button"
              onClick={() => {
                clearDrawForDate(dateKey);
                setStored(null);
                setPicked(null);
                setPickedIndex(null);
                setPickRotated(false);
                setPhase("idle");
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-indigo-50/90 transition hover:bg-white/10"
            >
              再抽一次（测试）
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-indigo-50/90">牌大小</p>
            <p className="text-xs text-indigo-100/60">拖动立即生效（{deckCardW}×{deckCardH}）</p>
          </div>
          <input
            type="range"
            min={56}
            max={140}
            step={2}
            value={deckCardW}
            onChange={(e) => setDeckCardW(Number(e.target.value))}
            onInput={(e) => setDeckCardW(Number((e.target as HTMLInputElement).value))}
            className="w-64 accent-indigo-400"
          />
        </div>
      </div>

      {picked && (phase === "revealed" || phase === "locked") ? (
        <div
          className="grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 lg:items-start"
          style={{ gridTemplateColumns: `${resultCardW}px minmax(0, 1fr)` }}
        >
          <div className="mx-auto" style={{ width: resultCardW, minWidth: resultCardW, maxWidth: resultCardW }}>
            <div className="tarot-perspective relative" style={{ width: resultCardW, height: resultCardH }}>
              <div
                className={[
                  "tarot-card3d relative h-full w-full rounded-2xl border border-white/10 shadow-[0_22px_70px_-45px_rgba(129,140,248,0.95)] ring-1 ring-white/10",
                  reducedMotion ? "" : "transition-transform duration-700"
                ].join(" ")}
                style={{ transform: `rotateY(${pickRotated ? 180 : 0}deg)` }}
              >
                <div className="tarot-face absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-300/10">
                  <div className="absolute inset-0 bg-[radial-gradient(closest-side,rgba(255,255,255,0.14),transparent)]" />
                  <div className="absolute inset-3 rounded-xl border border-white/10 bg-black/20" />
                  <div className="absolute bottom-4 left-4 text-xs text-indigo-50/80">Tarot</div>
                  <div className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-indigo-50/70">
                    {resultCardW}×{resultCardH}
                  </div>
                </div>
                <div className="tarot-face tarot-back absolute inset-0 overflow-hidden rounded-2xl bg-black/20">
                  <img
                    src={`/cards/${picked.card.id}.jpg`}
                    alt={`${picked.card.nameCn}牌面`}
                    className="absolute inset-0 h-full w-full object-cover"
                    data-fallback-stage="jpg"
                    onError={withCardFallback(picked.card.id, picked.card.nameCn)}
                  />
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-indigo-100/60">
              {phase === "revealed" ? "正在揭示…" : "已锁定（今日不可重抽）"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-indigo-100/60">今日自抽 · {dateKey}</p>
              <h2 className="text-2xl font-semibold tracking-tight">{formatTitle(picked.card, picked.isReversed)}</h2>
              <p className="text-sm text-indigo-100/70">{picked.card.nameEn}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {picked.card.keywords.slice(0, 8).map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-50/90"
                >
                  {k}
                </span>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-indigo-100/80">
                <p className="text-xs font-semibold text-indigo-50/90">总体</p>
                <p className="mt-2">{getMeaning(picked.card, picked.isReversed)}</p>
                <p className="mt-3">
                  <Link href={cardMeaningPagePath(picked.card.id, picked.isReversed, { from: pathname })} className="draw-result-full-meaning-link text-xs">
                    完整牌义 →
                  </Link>
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-indigo-100/80">
                <p className="text-xs font-semibold text-indigo-50/90">建议</p>
                <p className="mt-2">今天只做一个动作：围绕“{picked.card.keywords[0]}”迈出最小一步。</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  const text = `我今天自助抽到的塔罗（${dateKey}）：${formatTitle(picked.card, picked.isReversed)}\n${getMeaning(
                    picked.card,
                    picked.isReversed
                  )}\n${window.location.origin}/draw`;
                  await navigator.clipboard.writeText(text);
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10 transition hover:bg-indigo-400"
              >
                复制分享文案
              </button>
              <p className="text-xs text-indigo-100/55">
                抽牌时间：{stored?.drawnAt ? new Date(stored.drawnAt).toLocaleString("zh-CN") : "-"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="relative mx-auto h-[280px] max-w-[640px]">
            {Array.from({ length: cardsInDeck }).map((_, i) => {
              const k = `${shuffleSeed}:${i}`;
              const base = i * 2;
              const isClickable = phase === "pick";
              const isShuffling = phase === "shuffling";
              const dx = isShuffling ? ((i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 4) * (deckCardW / 72)) : 0;
              const dy = isShuffling ? ((i % 3) * -4 - 4) * (deckCardW / 72) : 0;
              const rot = isShuffling ? (i % 2 === 0 ? 6 : -6) : 0;

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => pickOne(i)}
                  disabled={!isClickable}
                  className={[
                    "rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/25 via-indigo-500/10 to-cyan-300/10 shadow-[0_22px_70px_-45px_rgba(129,140,248,0.95)] ring-1 ring-white/10",
                    reducedMotion ? "transition-none" : "transition-transform duration-700 will-change-transform",
                    isClickable ? "cursor-pointer hover:-translate-y-[54%] hover:scale-[1.03]" : "cursor-default opacity-90",
                    phase === "revealed" ? "pointer-events-none" : ""
                  ].join(" ")}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 72,
                    height: 102,
                    transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${deckScale})`,
                    zIndex: base
                  }}
                  aria-label={isClickable ? "点选这张牌" : "牌堆"}
                >
                  <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(closest-side,rgba(255,255,255,0.12),transparent)]" />
                  <div className="absolute inset-2 rounded-xl border border-white/10 bg-black/20" />
                  <div className="absolute inset-4 rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]" />
                  <div className="absolute bottom-2 left-2 text-[10px] tracking-wide text-indigo-50/75">Tarot</div>
                  <div className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-indigo-50/70">
                    {deckCardW}×{deckCardH}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 text-center text-xs text-indigo-100/60">
            {phase === "idle"
              ? "点击“开始抽牌”进入洗牌。"
              : phase === "shuffling"
                ? "正在洗牌…"
                : phase === "pick"
                  ? "现在可以点选任意一张。"
                  : "正在揭示…"}
          </div>
        </div>
      )}
    </div>
  );
}

