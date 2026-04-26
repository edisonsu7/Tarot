"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import cards from "@/data/cards.json";
import { TarotCardBackOrnate } from "@/components/TarotCardBackOrnate";
import {
  computeFanLayout,
  DAILY_FAN_COUNT,
  DRAW_PICK_LAYOUT_CHROME_PX,
  FAN_VERTICAL_ANCHOR,
  fanCardLayoutStyle,
  fanSlotTransform
} from "@/lib/dailyDrawHelpers";
import { getDateKeyInTimeZone } from "@/lib/dateKey";
import {
  clearDrawForDate,
  getDrawForDate,
  getOrCreateUserId,
  saveDrawForDate,
  type SpreadType,
  type StoredPick,
  type StoredRecord
} from "@/lib/drawStorage";
import { cardMeaningPagePath, getMeaningPreview } from "@/lib/cardMeaningDetail";
import { clearFeedbackEntry } from "@/lib/feedbackStorage";
import { getMeaning } from "@/lib/fortune";
import { HOME_SURFACE } from "@/components/homeLayout";

type TarotCard = (typeof cards)[number];
type Phase = "idle" | "shuffling" | "selecting" | "revealing" | "leaving" | "result";
type QuestionType = "综合" | "感情" | "事业" | "学业";
type HomePath = "daily" | "question";
type FeatureMode = "mixed" | "daily" | "draw";

type DrawDraft = {
  question?: string;
  questionType?: unknown;
  spread?: string;
};

function normalizeQuestionType(raw: unknown): QuestionType {
  const s = String(raw ?? "");
  if (s === "综合" || s === "感情" || s === "事业" || s === "学业") return s;
  if (s === "爱情") return "感情";
  return "综合";
}

function playTone(params: { type: OscillatorType; from: number; to?: number; durMs: number; vol?: number }, enabled: boolean) {
  if (!enabled) return;
  try {
    type WinAudio = Window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext ?? (window as WinAudio).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = params.type;
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(params.from, now);
    if (params.to != null) o.frequency.exponentialRampToValueAtTime(params.to, now + params.durMs / 1000);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(params.vol ?? 0.05, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + params.durMs / 1000);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + params.durMs / 1000);
    o.onended = () => ctx.close();
  } catch {}
}

function sfxShuffle(enabled: boolean) {
  playTone({ type: "triangle", from: 220, to: 120, durMs: 220, vol: 0.03 }, enabled);
}
function sfxFlip(enabled: boolean) {
  playTone({ type: "sine", from: 880, to: 520, durMs: 140, vol: 0.04 }, enabled);
}
function sfxPick(enabled: boolean) {
  playTone({ type: "square", from: 660, durMs: 90, vol: 0.02 }, enabled);
}

function randInt(maxExclusive: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
}

function randBool() {
  return randInt(2) === 0;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function getCardById(id: string): TarotCard | null {
  return (cards as TarotCard[]).find((c) => c.id === id) ?? null;
}

function formatTitle(card: TarotCard, isReversed: boolean) {
  return `${card.nameCn}${isReversed ? "（逆位）" : "（正位）"}`;
}

function pickKeywords(card: TarotCard, max = 3) {
  return (card.keywords || []).slice(0, max);
}

function joinKeywords(card: TarotCard, max = 2) {
  const ks = pickKeywords(card, max);
  return ks.length ? ks.join("、") : "当下最重要的一件事";
}

function suitableText(card: TarotCard) {
  const ks = pickKeywords(card, 3);
  const list = ks.length ? ks : ["整理", "沟通", "推进"];
  return `适合：${list.join(" / ")} / 写计划 / 做一个小决定。`;
}

function notSuitableText(card: TarotCard, reversed: boolean) {
  const base = "不适合：冲动决定 / 过度承诺 / 在情绪高点硬刚。";
  const ks = pickKeywords(card, 2);
  if (!reversed) return base;
  return ks.length ? `${base} 尤其避免“${ks.join("、")}”上的极端做法。` : base;
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

function spreadPositions(type: SpreadType): string[] {
  switch (type) {
    case "single":
      return ["今日建议"];
    case "three":
      return ["现状", "阻碍", "建议"];
    case "love3":
      return ["我", "对方", "关系发展"];
    case "career3":
      return ["现状", "阻碍", "建议"];
    default:
      return ["今日建议"];
  }
}

function deckPickPhase(phase: Phase): boolean {
  return phase === "selecting" || phase === "revealing" || phase === "leaving";
}

/** 扇面 / 选牌区中央提示 */
function selectionHint(spread: SpreadType, pickedLen: number, phase: Phase): string {
  const need = spreadPositions(spread).length;
  if (phase === "leaving" || pickedLen >= need) return "牌已选定，正在生成解读…";
  if (phase === "revealing") return "正在翻开…";
  if (phase === "shuffling") return "正在洗牌，请稍等…";
  if (spread === "single") return "请选择一张牌。";
  const next = spreadPositions(spread)[pickedLen];
  if (!next) return "请选择一张牌。";
  return `请选择第 ${pickedLen + 1} 张牌：${next}`;
}

/** 结果页标题行，如「三张牌解读｜综合」 */
function drawResultHeadline(spread: SpreadType, questionType: QuestionType): string {
  const head =
    spread === "single"
      ? "单张牌解读"
      : spread === "three"
        ? "三张牌解读"
        : spread === "love3"
          ? "爱情三牌解读"
          : spread === "career3"
            ? "事业三牌解读"
            : "抽牌解读";
  return `${head}｜${questionType}`;
}

function oneLineConclusion(qt: QuestionType, card: TarotCard, reversed: boolean) {
  const k = joinKeywords(card, 2);
  if (reversed) return `今天适合先稳住「${k}」相关节奏，不适合在压力下硬推结果。`;
  if (qt === "感情") return `今天适合用稳定沟通推进关系，不适合靠猜测或试探做决定。`;
  if (qt === "事业") return `今天适合把关键任务往前推一步，不适合把精力分散在太多方向。`;
  if (qt === "学业") return `今天适合把学习任务拆小并完成一块，不适合贪多导致拖延。`;
  return `今天适合围绕「${k}」做一个小而确定的行动，不适合反复犹豫。`;
}

function summary3(qt: QuestionType, picked: Array<{ position: string; card: TarotCard; isReversed: boolean }>) {
  const now = picked.find((p) => p.position === "阻碍") ?? picked[1] ?? picked[0]!;
  const key = (now.card.keywords ?? []).slice(0, 2).join("、") || "关键点";
  const tone = now.isReversed ? "更适合先稳住" : "更适合推进";
  const domain = qt === "综合" ? "整体" : qt === "感情" ? "感情" : qt === "事业" ? "事业" : "学业";
  return `总结：当前在${domain}上${tone}。把注意力放在“${key}”，用小步行动换取确定性。`;
}

function spreadFinalTendency(type: SpreadType, picked: Array<{ position: string; card: TarotCard; isReversed: boolean }>) {
  const reversedCount = picked.filter((p) => p.isReversed).length;
  const last = picked[picked.length - 1]!;
  const key = joinKeywords(last.card, 2);
  const tendency = reversedCount >= 2 ? "最终倾向偏谨慎" : last.isReversed ? "最终倾向需要观察" : "最终倾向可以推进";
  if (type === "love3") return `${tendency}。关系发展的关键在“${key}”，不要只看当下情绪，要看双方是否愿意持续沟通。`;
  if (type === "career3") return `${tendency}。真正的突破点在“${key}”，先处理阻碍，再谈加速。`;
  return `${tendency}。后续节奏取决于你是否能围绕“${key}”做出稳定的小行动。`;
}

function coreTip(qt: QuestionType, card: TarotCard, reversed: boolean) {
  const kws = (card.keywords ?? []).slice(0, 4);
  const base = kws.length ? kws.join("、") : "保持稳定的节奏";
  const tone = reversed ? "先稳住，再调整" : "稳住方向，顺势推进";
  if (qt === "感情") return `${tone}，把重心放在“沟通与边界”。（${base}）`;
  if (qt === "事业") return `${tone}，优先做“关键任务”和“可验证的推进”。（${base}）`;
  if (qt === "学业") return `${tone}，先把计划拆小并坚持完成。 （${base}）`;
  return `${tone}，抓住牌面强调的重点。 （${base}）`;
}

function doNow(qt: QuestionType, card: TarotCard, reversed: boolean) {
  if (reversed) {
    if (qt === "感情") return "先把话说清楚：减少试探与冷处理，用事实和感受表达需求。";
    if (qt === "事业") return "先补短板：把卡住你的步骤写下来，逐个解决（先易后难）。";
    if (qt === "学业") return "先定一个小目标：专注完成一块内容，再考虑加码。";
    return "先做“收敛”：减少变量、降低承诺，把节奏拉回可控范围。";
  }
  if (qt === "感情") return "用稳定的方式推进：温和但坚定地沟通，给彼此一个明确的下一步。";
  if (qt === "事业") return "把关键动作落地：今天至少完成一个可交付的小成果，推动进度。";
  if (qt === "学业") return "进入专注块：用番茄钟或分段法，先完成一段可检验的学习。";
  return "把建议变成动作：选一个最重要的点，今天就做第一步。";
}

function avoidToday(qt: QuestionType, reversed: boolean) {
  if (reversed) {
    if (qt === "感情") return "避免翻旧账、情绪化拉扯、用沉默惩罚对方。";
    if (qt === "事业") return "避免一次性接太多任务、在不清楚需求时就开始硬做。";
    if (qt === "学业") return "避免熬夜硬撑、只囤资料不动笔、用焦虑刷手机逃避。";
    return "避免冲动决定、过度承诺、用焦虑驱动行动。";
  }
  if (qt === "感情") return "避免用强硬姿态逼结果，也不要用猜测代替沟通。";
  if (qt === "事业") return "避免拖延到最后一刻、只做“看起来忙”的事。";
  if (qt === "学业") return "避免贪多嚼不烂、跳过基础直接啃难题。";
  return "避免分心和反复横跳；不要为了快而忽略质量。";
}

export function DrawDeck2({ feature = "mixed", pickOnly = false }: { feature?: FeatureMode; pickOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const timeZone = "Asia/Shanghai";
  const dateKey = useMemo(() => getDateKeyInTimeZone(new Date(), timeZone), []);
  const isDailyFeature = feature === "daily";
  const isDrawFeature = feature === "draw";
  const isSeparatedFeature = feature !== "mixed";
  const immersivePick = pickOnly && isSeparatedFeature;

  const [phase, setPhase] = useState<Phase>("idle");
  const [transitionKey, setTransitionKey] = useState(0);
  const [stored, setStored] = useState<StoredRecord | null>(null);
  const [picked, setPicked] = useState<Array<{ position: string; card: TarotCard; isReversed: boolean }>>([]);
  const [mode, setMode] = useState<"test" | "daily">("test");
  const [spread, setSpread] = useState<SpreadType>("single");
  const [deckOptions, setDeckOptions] = useState<Array<{ card: TarotCard; isReversed: boolean }>>([]);
  const [pickedIdxs, setPickedIdxs] = useState<number[]>([]);
  const [flippedIdxs, setFlippedIdxs] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [viewportW, setViewportW] = useState<number>(1200);
  const [viewportH, setViewportH] = useState<number>(820);
  const [sfx, setSfx] = useState(true);
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("综合");
  const [homePath, setHomePath] = useState<HomePath>(isDailyFeature ? "daily" : "question");
  const [draftReady, setDraftReady] = useState(!pickOnly);
  /** 选牌齐后 → 结果前：遮罩 + 扇面退场 */
  const [pickToResultBridge, setPickToResultBridge] = useState(false);
  const [revealingPickIndex, setRevealingPickIndex] = useState<number | null>(null);

  // Fixed sizes (do not adjust) — 非沉浸式选牌页横排用。
  const deckW = 140;
  const deckH = 199;
  const pickCount = useMemo(
    () => (immersivePick ? DAILY_FAN_COUNT : spread === "single" ? 5 : 9),
    [immersivePick, spread]
  );

  const fanMetrics = useMemo(() => {
    if (!immersivePick) return null;
    return computeFanLayout({
      cardCount: pickCount,
      viewportW,
      viewportH: Math.max(380, viewportH - DRAW_PICK_LAYOUT_CHROME_PX)
    });
  }, [immersivePick, pickCount, viewportW, viewportH]);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /** 结果页左列牌图固定宽度，与 `.result-layout` 一致 */
  const RESULT_CARD_COL_W = 280;
  const resultCardImgH = Math.round((RESULT_CARD_COL_W * 3) / 2);
  const pickSlotTotal = spreadPositions(spread).length;

  useLayoutEffect(() => {
    getOrCreateUserId();
    try {
      if (pickOnly) {
        if (!isDailyFeature) {
          const rawDraft = window.localStorage.getItem("tarot:drawDraft");
          let spreadFromDraft = false;
          if (rawDraft) {
            const draft = JSON.parse(rawDraft) as DrawDraft;
            if (typeof draft.question === "string") setQuestion(draft.question);
            if (draft.questionType != null) setQuestionType(normalizeQuestionType(draft.questionType));
            if (draft.spread === "single") {
              setSpread("single");
              spreadFromDraft = true;
            } else if (draft.spread === "three" || draft.spread === "love3" || draft.spread === "career3") {
              setSpread("three");
              spreadFromDraft = true;
            }
          }
          if (!spreadFromDraft) {
            const s = window.localStorage.getItem("tarot:spread");
            if (s === "single") setSpread("single");
            else if (s === "three" || s === "love3" || s === "career3") setSpread("three");
          }
        }
        setDraftReady(true);
      }
      const m = window.localStorage.getItem("tarot:mode");
      if (!isSeparatedFeature && (m === "daily" || m === "test")) setMode(m);
      if (!pickOnly && !isDailyFeature) {
        const s = window.localStorage.getItem("tarot:spread");
        if (s === "single") setSpread("single");
        else if (s === "three" || s === "love3" || s === "career3") setSpread("three");
      }
      const se = window.localStorage.getItem("tarot:sfx");
      if (se === "0" || se === "1") setSfx(se === "1");
      const qt = window.localStorage.getItem("tarot:questionType");
      if (qt) setQuestionType(normalizeQuestionType(qt));
      const hp = window.localStorage.getItem("tarot:homePath");
      if (!isSeparatedFeature && (hp === "daily" || hp === "question")) setHomePath(hp);
    } catch {}

    // 从完整牌义页返回：保持在“结果态”，避免回到选牌流程顶端
    if (isDrawFeature && pickOnly && searchParams?.get("result") === "1") {
      try {
        const raw = sessionStorage.getItem("tarot:lastPickPayload");
        if (raw) {
          const payload = JSON.parse(raw) as {
            mode?: string;
            spread?: string;
            question?: string;
            category?: unknown;
            selectedCards?: Array<{ position: string; cardId: string; orientation: "upright" | "reversed" }>;
            createdAt?: string;
          };
          if (payload?.mode === "question" && Array.isArray(payload.selectedCards) && payload.selectedCards.length) {
            const nextPicked = payload.selectedCards
              .map((p) => {
                const c = getCardById(p.cardId);
                return c ? { position: p.position, card: c, isReversed: p.orientation === "reversed" } : null;
              })
              .filter(Boolean) as Array<{ position: string; card: TarotCard; isReversed: boolean }>;
            if (nextPicked.length) {
              const sp: SpreadType = payload.spread === "three" ? "three" : "single";
              setSpread(sp);
              setQuestion(typeof payload.question === "string" ? payload.question : "");
              if (payload.category != null) setQuestionType(normalizeQuestionType(payload.category));
              const drawnAt = typeof payload.createdAt === "string" ? payload.createdAt : new Date().toISOString();
              if (sp === "single") {
                setStored({
                  cardId: nextPicked[0]!.card.id,
                  isReversed: nextPicked[0]!.isReversed,
                  drawnAt,
                  question: payload.question?.trim() ? payload.question.trim() : undefined,
                  questionType: normalizeQuestionType(payload.category)
                });
              } else {
                setStored({
                  type: "three",
                  picks: nextPicked.map((p) => ({ position: p.position, cardId: p.card.id, isReversed: p.isReversed })),
                  drawnAt,
                  question: payload.question?.trim() ? payload.question.trim() : undefined,
                  questionType: normalizeQuestionType(payload.category)
                });
              }
              setPicked(nextPicked);
              setPhase("result");
              return;
            }
          }
        }
      } catch {}
    }

    const d = isDrawFeature ? null : getDrawForDate(dateKey);
    if (d) {
      if ("picks" in d) {
        if (pickOnly && isDailyFeature) {
          router.replace("/daily");
          return;
        }
        const restored = d.picks
          .map((p) => {
            const c = getCardById(p.cardId);
            return c ? { position: p.position, card: c, isReversed: p.isReversed } : null;
          })
          .filter(Boolean) as Array<{ position: string; card: TarotCard; isReversed: boolean }>;
        if (restored.length) {
          setStored(d);
          setPicked(restored);
          setSpread(d.type);
          setPhase("result");
          return;
        }
      } else {
        const card = getCardById(d.cardId);
        if (card) {
          if (pickOnly && isDailyFeature) {
            router.replace("/daily/result");
            return;
          }
          setStored(d);
          setPicked([{ position: "今日建议", card, isReversed: d.isReversed }]);
          setSpread("single");
          setPhase("result");
          return;
        }
      }
    }
    setPhase("idle");
  }, [dateKey, isDailyFeature, isDrawFeature, isSeparatedFeature, pickOnly]);

  useLayoutEffect(() => {
    // 选牌页进入后立即开始：不要“洗牌等待 1 秒”的过渡页
    if (!pickOnly || !draftReady || phase !== "idle") return;
    start({ instant: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickOnly, draftReady, phase]);

  // URL presets: /?mode=daily&spread=single&autostart=1
  useEffect(() => {
    const m = searchParams?.get("mode");
    const sp = searchParams?.get("spread");
    const autostart = searchParams?.get("autostart");
    const hp = searchParams?.get("path");
    if (!isSeparatedFeature && (m === "daily" || m === "test")) setMode(m);
    if (!isDailyFeature) {
      if (sp === "single") setSpread("single");
      else if (sp === "three" || sp === "love3" || sp === "career3") setSpread("three");
    }
    if (!isSeparatedFeature && (hp === "daily" || hp === "question")) setHomePath(hp);
    if (autostart === "1") {
      window.setTimeout(() => {
        const existing = getDrawForDate(dateKey);
        if (!existing && phase === "idle") start();
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isDailyFeature, isSeparatedFeature]);

  useEffect(() => {
    if (isSeparatedFeature) return;
    try {
      window.localStorage.setItem("tarot:mode", mode);
    } catch {}
  }, [mode, isSeparatedFeature]);

  useEffect(() => {
    if (isDailyFeature) return;
    try {
      window.localStorage.setItem("tarot:spread", spread);
    } catch {}
  }, [spread, isDailyFeature]);

  useEffect(() => {
    try {
      window.localStorage.setItem("tarot:sfx", sfx ? "1" : "0");
    } catch {}
  }, [sfx]);

  useEffect(() => {
    try {
      window.localStorage.setItem("tarot:questionType", questionType);
    } catch {}
  }, [questionType]);

  useEffect(() => {
    if (isSeparatedFeature) return;
    try {
      window.localStorage.setItem("tarot:homePath", homePath);
    } catch {}
  }, [homePath, isSeparatedFeature]);

  useEffect(() => {
    if (isDailyFeature) {
      setHomePath("daily");
      setMode("daily");
      setSpread("single");
      setQuestion("");
      return;
    }
    if (isDrawFeature) {
      setHomePath("question");
      setMode("test");
      return;
    }
    if (homePath !== "daily") return;
    setMode("daily");
    setSpread("single");
  }, [homePath, isDailyFeature, isDrawFeature]);

  const modeLabel =
    mode === "daily" ? "每日一次锁定：同一天不会改变结果" : "测试可重抽：可反复抽牌（不锁定）";

  function reset() {
    if (mode === "daily") {
      clearDrawForDate(dateKey);
      clearFeedbackEntry(`history:${dateKey}`);
    }
    setStored(null);
    setPicked([]);
    setPickedIdxs([]);
    setDeckOptions([]);
    setFlippedIdxs([]);
    setPhase("idle");
    setPickToResultBridge(false);
    setRevealingPickIndex(null);
    setTransitionKey((k) => k + 1);
  }

  function start(opts?: { instant?: boolean }) {
    if (phase !== "idle") return;
    if (mode === "daily") {
      const existing = getDrawForDate(dateKey);
      if (existing) return;
    }
    setPickToResultBridge(false);
    const instant = opts?.instant === true;
    if (!instant) {
      setPhase("shuffling");
      sfxShuffle(sfx);
      window.setTimeout(() => setPhase("selecting"), immersivePick ? 1200 : 1400);
    } else {
      setPhase("selecting");
    }
    const pool = shuffleInPlace([...(cards as TarotCard[])]).slice(0, pickCount);
    setDeckOptions(pool.map((c) => ({ card: c, isReversed: randBool() })));
    setPicked([]);
    setPickedIdxs([]);
    setFlippedIdxs([]);
    setRevealingPickIndex(null);
    setTransitionKey((k) => k + 1);
  }

  function finalizePickResult(nextPicked: Array<{ position: string; card: TarotCard; isReversed: boolean }>) {
    const drawnAt = new Date().toISOString();
    const qtSave: QuestionType = isDailyFeature ? "综合" : questionType;
    const qSave = isDailyFeature ? undefined : question.trim() || undefined;
    let record: StoredRecord;
    if (spread === "single") {
      record = { cardId: nextPicked[0]!.card.id, isReversed: nextPicked[0]!.isReversed, drawnAt, question: qSave, questionType: qtSave };
    } else {
      const picks: StoredPick[] = nextPicked.map((p) => ({ cardId: p.card.id, isReversed: p.isReversed, position: p.position }));
      record = { type: spread, picks, drawnAt, question: qSave, questionType: qtSave };
    }
    try {
      sessionStorage.setItem(
        "tarot:lastPickPayload",
        JSON.stringify({
          mode: isDrawFeature ? "question" : "daily",
          spread,
          question: question.trim() || "",
          category: questionType,
          selectedCards: nextPicked.map((p) => ({
            position: p.position,
            cardId: p.card.id,
            orientation: p.isReversed ? "reversed" : "upright"
          })),
          createdAt: drawnAt
        })
      );
    } catch {}
    const storageKey = mode === "daily" ? dateKey : `${dateKey}:${Date.now()}`;
    saveDrawForDate(storageKey, record);
    setPickToResultBridge(false);
    if (isDailyFeature && pickOnly) {
      router.push("/daily/result");
      return;
    }
    setStored(record);
    setPhase("result");
    setTransitionKey((k) => k + 1);
  }

  function pickOne(_index: number) {
    if (phase !== "selecting") return;
    if (pickToResultBridge) return;
    if (pickedIdxs.includes(_index)) return;
    const opt = deckOptions[_index];
    if (!opt) return;
    const positions = spreadPositions(spread);
    const nextPosition = positions[picked.length];
    if (!nextPosition) return;

    sfxPick(sfx);
    setPhase("revealing");
    setRevealingPickIndex(_index);
    setFlippedIdxs((prev) => (prev.includes(_index) ? prev : [...prev, _index]));
    window.setTimeout(() => sfxFlip(sfx), 90);

    const flipMs = 720;
    window.setTimeout(() => {
      const nextPicked = [...picked, { position: nextPosition, card: opt.card, isReversed: opt.isReversed }];
      const nextIdxs = [...pickedIdxs, _index];
      setPicked(nextPicked);
      setPickedIdxs(nextIdxs);
      setRevealingPickIndex(null);

      if (nextPicked.length < positions.length) {
        setPhase("selecting");
        return;
      }

      setPhase("leaving");
      setPickToResultBridge(true);
      window.setTimeout(() => {
        finalizePickResult(nextPicked);
      }, 520);
    }, flipMs);
  }

  async function copyDrawResult() {
    try {
      const c0 = picked[0]!;
      const lines: string[] = [];
      lines.push(`${formatTitle(c0.card, c0.isReversed)} / ${c0.card.nameEn}`);
      if (isDailyFeature && spread === "single") {
        lines.push(`关键词：${(c0.card.keywords ?? []).slice(0, 8).join("、") || "-"}`);
        lines.push(`一句话提醒：${oneLineConclusion("综合", c0.card, c0.isReversed)}`);
        lines.push(`今天适合：${suitableText(c0.card)}`);
        lines.push(`今天不适合：${notSuitableText(c0.card, c0.isReversed)}`);
      } else if (spread === "single") {
        if (question.trim()) lines.push(`问题：${question.trim()}`);
        lines.push(`类型：${questionType}`);
        lines.push(`关键词：${(c0.card.keywords ?? []).slice(0, 8).join("、") || "-"}`);
        lines.push(`一句话：${oneLineConclusion(questionType, c0.card, c0.isReversed)}`);
        lines.push(`核心提示：${coreTip(questionType, c0.card, c0.isReversed)}`);
        lines.push(`行动建议：${doNow(questionType, c0.card, c0.isReversed)}`);
        lines.push(`需要避免：${avoidToday(questionType, c0.isReversed)}`);
        lines.push(`牌义：${getMeaning(c0.card, c0.isReversed) || "-"}`);
      } else {
        if (question.trim()) lines.push(`问题：${question.trim()}`);
        lines.push(`类型：${questionType}`);
        lines.push(`整体结论：${summary3(questionType, picked)}`);
        lines.push(`核心提醒：${spreadFinalTendency(spread, picked)}`);
        lines.push("");
        for (const p of picked) {
          lines.push(`${p.position}：${formatTitle(p.card, p.isReversed)}`);
          lines.push(getMeaning(p.card, p.isReversed) || "-");
          lines.push("");
        }
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      if (spread === "single") {
        lines.push("");
        lines.push(`深度牌义：${origin}${cardMeaningPagePath(picked[0]!.card.id, picked[0]!.isReversed, { from: pathname })}`);
      } else {
        lines.push("");
        lines.push("各张深度牌义：");
        for (const p of picked) {
          lines.push(`${p.position}：${origin}${cardMeaningPagePath(p.card.id, p.isReversed, { from: pathname })}`);
        }
      }
      await navigator.clipboard.writeText(lines.join("\n").trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  // pickOnly 进入选牌：避免首帧渲染 idle 造成“闪一下空白页”
  if (pickOnly && draftReady && phase === "idle") return null;

  return (
    <div className="mist" style={{ display: "grid", gap: immersivePick ? 12 : 16 }}>
      {!immersivePick && (
      <div className={HOME_SURFACE}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div className="cream-card-title">
              {phase === "result"
                ? "Tarot"
                : phase === "shuffling"
                  ? "正在洗牌"
                  : deckPickPhase(phase)
                    ? "选牌中"
                    : pickOnly
                      ? "正在进入选牌页"
                      : "准备好了吗？"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ui-body)" }}>
              {phase === "result"
                ? `${homePath === "daily" ? "今日指引已完成" : "灵感问牌已完成"}｜${dateKey}`
                : homePath === "daily"
                  ? `今日指引：仅一张牌（${dateKey}，${timeZone}）`
                  : `${modeLabel}（${dateKey}，${timeZone}）`}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {phase === "idle" && !pickOnly && (
              <button
                type="button"
                onClick={() => start()}
                className="btn-tarot-primary"
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 800
                }}
              >
                {homePath === "daily" ? "开始今日指引" : "开始灵感问牌"}
              </button>
            )}
            {phase === "result" && isDrawFeature && (
              <button
                type="button"
                onClick={() => {
                  reset();
                }}
                style={{
                  height: 40,
                  padding: "0 14px",
                  borderRadius: 14,
                  border: "1px solid var(--ui-border)",
                  background: "var(--ui-surface)",
                  color: "var(--ui-strong)",
                  fontSize: 14,
                  fontWeight: 800
                }}
              >
                再抽一次
              </button>
            )}
            <Link
              href="/cards"
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 14,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                color: "var(--ui-strong)",
                fontSize: 14,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none"
              }}
            >
              去牌库
            </Link>
            <Link
              href="/about"
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 14,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                color: "var(--ui-strong)",
                fontSize: 14,
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none"
              }}
            >
              说明
            </Link>
          </div>
        </div>

        {phase !== "result" && !pickOnly && (
          <>
        <div style={{ height: 8 }} />
        <div style={{ display: "grid", gap: 10 }}>
          {!isSeparatedFeature && (
            <div style={{ width: "100%", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "var(--ui-body)" }}>首页路径</div>
              <button
                type="button"
                onClick={() => {
                  setHomePath("daily");
                  setMode("daily");
                  setSpread("single");
                  setQuestion("");
                }}
                className={`ios-chip ${homePath === "daily" ? "ios-chip-active" : ""}`}
              >
                今日指引
              </button>
              <button
                type="button"
                onClick={() => {
                  setHomePath("question");
                }}
                className={`ios-chip ${homePath === "question" ? "ios-chip-active" : ""}`}
              >
                灵感问牌
              </button>
              {homePath === "daily" && (
                <div style={{ fontSize: 12, color: "var(--ui-dim)" }}>每日锁定 · 单张牌 · 自动给今日建议</div>
              )}
            </div>
          )}

          <div style={{ width: "100%", display: "grid", gap: 8 }}>
            {!isDailyFeature && homePath === "question" && (
              <>
                <label style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--ui-body)", fontWeight: 800 }}>你的问题</div>
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="例如：我该不该换工作？/ 这段关系要怎么推进？"
                    style={{
                      height: 40,
                      borderRadius: 14,
                      border: "1px solid var(--ui-border)",
                      background: "var(--ui-input-bg)",
                      padding: "0 12px",
                      color: "var(--ui-strong)",
                      outline: "none"
                    }}
                  />
                </label>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--ui-body)" }}>问题类型</div>
                  {(["综合", "感情", "事业", "学业"] as QuestionType[]).map((qt) => (
                    <button
                      key={qt}
                      type="button"
                      onClick={() => setQuestionType(qt)}
                      className={`ios-chip ${questionType === qt ? "ios-chip-active" : ""}`}
                    >
                      {qt}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--ui-body)" }}>选择牌阵</div>
                  <button
                    type="button"
                    onClick={() => setSpread("single")}
                    className={`ios-chip ${spread === "single" ? "ios-chip-active" : ""}`}
                  >
                    单张牌
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpread("three")}
                    className={`ios-chip ${spread === "three" ? "ios-chip-active" : ""}`}
                  >
                    三张牌
                  </button>
                </div>
              </>
            )}
          </div>

          {!isSeparatedFeature && (
            <>
              <div style={{ fontSize: 12, color: "var(--ui-body)" }}>模式</div>
              {homePath === "daily" ? (
                <span className="ios-chip ios-chip-active">每日一次锁定</span>
              ) : (
                <>
                  <button type="button" onClick={() => setMode("test")} className={`ios-chip ${mode === "test" ? "ios-chip-active" : ""}`}>
                    测试可重抽
                  </button>
                  <button type="button" onClick={() => setMode("daily")} className={`ios-chip ${mode === "daily" ? "ios-chip-active" : ""}`}>
                    每日一次锁定
                  </button>
                </>
              )}
            </>
          )}
          {isDailyFeature && <div style={{ fontSize: 12, color: "var(--ui-dim)" }}>今日指引固定为单张牌；每天只锁定一次。</div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            {isDrawFeature && (
              <div style={{ fontSize: 12, color: "var(--ui-dim)" }}>
                流程：1. 输入问题  2. 选类型与牌阵  3. 开始抽牌  4. 从牌背中选择
                {!question.trim() ? "（未输入问题，将按综合运势解读）" : ""}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setSfx((v) => {
                  const next = !v;
                  try {
                    window.localStorage.setItem("tarot:sfx", next ? "1" : "0");
                  } catch {}
                  window.dispatchEvent(new Event("tarot:sfx-changed"));
                  return next;
                });
              }}
              className="ios-chip"
              style={{ transform: "scale(0.92)", transformOrigin: "right center", opacity: 0.78, marginLeft: "auto" }}
            >
              音效：{sfx ? "开" : "关"}
            </button>
          </div>
        </div>
          </>
        )}
      </div>
      )}

      {phase === "result" && picked.length > 0 ? (
        <div className="result-container">
          {picked.length > 1 ? (
            <div key={`result-${transitionKey}`} className="draw-result-multi draw-result-reveal-stage">
              {isDrawFeature && (
                <section className="draw-result-qblock">
                  <div className="draw-result-qblock__label">你的问题</div>
                  <p className="draw-result-qblock__text">{question.trim() ? question.trim() : "未填写，按综合方向解读。"}</p>
                </section>
              )}
              <section className="draw-result-meta">
                <h2 className="draw-result-meta__title">{drawResultHeadline(spread, questionType)}</h2>
                <ul className="draw-result-meta__lines">
                  {picked.map((p) => (
                    <li key={`${p.position}-meta`}>
                      {p.position}：{formatTitle(p.card, p.isReversed)}
                    </li>
                  ))}
                </ul>
                <p className="draw-result-meta__time">抽牌时间 {stored ? new Date(stored.drawnAt).toLocaleString("zh-CN") : "-"}</p>
              </section>
              <div className="draw-result-triple-row">
                {picked.map((p) => (
                  <div key={p.position} className="draw-result-triple-cell">
                    <span className="draw-result-pos-badge">{p.position}</span>
                    <img
                      className="result-card-img"
                      src={`/cards/${p.card.id}.jpg`}
                      data-fallback-stage="jpg"
                      onError={withCardFallback(p.card.id, p.card.nameCn)}
                      alt={p.card.nameCn}
                      width={230}
                      height={345}
                    />
                    <div className="draw-result-triple-bracket">
                      [{p.position}] {formatTitle(p.card, p.isReversed)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="draw-result-highlight-row">
                <div className="draw-result-interpret draw-result-interpret--lift">
                  <p className="draw-result-interpret__label">整体结论</p>
                  <p className="draw-result-interpret__text">{summary3(questionType, picked)}</p>
                </div>
                <div className="draw-result-interpret draw-result-interpret--lift">
                  <p className="draw-result-interpret__label">核心提醒</p>
                  <p className="draw-result-interpret__text">{spreadFinalTendency(spread, picked)}</p>
                </div>
              </div>
              <p className="draw-result-slots-section-title">各位置解读</p>
              <div className="draw-result-slot-grid">
                {picked.map((p) => (
                  <article key={p.position} className="draw-result-slot-card">
                    <p className="draw-result-slot-card__pos">{p.position}</p>
                    <p className="draw-result-slot-card__name">{formatTitle(p.card, p.isReversed)}</p>
                    <p className="draw-result-slot-card__text">{getMeaningPreview(p.card, p.isReversed, 200)}</p>
                    <Link href={cardMeaningPagePath(p.card.id, p.isReversed, { from: pathname })} className="draw-result-full-meaning-link">
                      阅读完整牌义 →
                    </Link>
                  </article>
                ))}
              </div>
              {!immersivePick && (
                <div className="draw-result-actions">
                  <button type="button" onClick={() => void copyDrawResult()} className="ios-chip ios-chip-active" style={{ height: 38, padding: "0 16px", fontSize: 13, fontWeight: 800 }}>
                    {copied ? "已复制" : "复制结果"}
                  </button>
                  <Link href="/history" className="ios-chip" style={{ height: 38, padding: "0 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    查看记录 →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div key={`result-${transitionKey}`} className="result-layout draw-result-reveal-stage">
              <div className="draw-result-card-col" style={{ width: "100%", maxWidth: RESULT_CARD_COL_W, display: "grid", gap: 10 }}>
                <img
                  src={`/cards/${picked[0]!.card.id}.jpg`}
                  data-fallback-stage="jpg"
                  onError={withCardFallback(picked[0]!.card.id, picked[0]!.card.nameCn)}
                  alt={picked[0]!.card.nameCn}
                  width={RESULT_CARD_COL_W}
                  height={resultCardImgH}
                  style={{
                    width: "100%",
                    maxWidth: RESULT_CARD_COL_W,
                    height: "auto",
                    aspectRatio: "2 / 3",
                    display: "block",
                    borderRadius: 16,
                    objectFit: "contain",
                    background: "var(--ui-thumb-bg)",
                    border: "1px solid var(--ui-border)",
                    boxShadow: "var(--ui-glow-shadow)"
                  }}
                />
              </div>
              <div className="draw-result-reveal-right" style={{ display: "grid", gap: 12, alignContent: "start" }}>
                {isDrawFeature && (
                  <section className="draw-result-qblock">
                    <div className="draw-result-qblock__label">你的问题</div>
                    <p className="draw-result-qblock__text">{question.trim() ? question.trim() : "未填写，按综合方向解读。"}</p>
                  </section>
                )}
                <section className="draw-result-meta draw-result-meta--single">
                  <h2 className="draw-result-meta__title">{drawResultHeadline(spread, questionType)}</h2>
                  <p className="draw-result-meta__lines" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--ui-strong)", lineHeight: 1.4 }}>
                    {formatTitle(picked[0]!.card, picked[0]!.isReversed)}
                  </p>
                  <p className="draw-result-meta__sub" style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ui-body)" }}>
                    {picked[0]!.card.nameEn}
                  </p>
                  <p className="draw-result-meta__time" style={{ marginTop: 10 }}>
                    抽牌时间：{stored ? new Date(stored.drawnAt).toLocaleString("zh-CN") : "-"}
                  </p>
                </section>
                {!immersivePick && (
                  <div className="draw-result-actions" style={{ order: 3 }}>
                    <button type="button" onClick={() => void copyDrawResult()} className="ios-chip ios-chip-active" style={{ height: 38, padding: "0 16px", fontSize: 13, fontWeight: 800 }}>
                      {copied ? "已复制" : isDrawFeature ? "复制结果" : "复制全文"}
                    </button>
                    <Link href="/history" className="ios-chip" style={{ height: 38, padding: "0 14px", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      {isDrawFeature ? "查看记录 →" : "查看历史 →"}
                    </Link>
                  </div>
                )}
                <div style={{ display: "grid", gap: 14, order: 2 }}>
                  {isDailyFeature && spread === "single" ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">今日关键词</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {(picked[0]!.card.keywords ?? []).slice(0, 8).map((k) => (
                            <span key={k} className="draw-kw-chip">
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">一句话提醒</p>
                        <p className="draw-result-interpret__text">{oneLineConclusion("综合", picked[0]!.card, picked[0]!.isReversed)}</p>
                      </div>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">今天怎么过</p>
                        <p className="draw-result-interpret__text">{suitableText(picked[0]!.card)}</p>
                        <p className="draw-result-interpret__sub">{notSuitableText(picked[0]!.card, picked[0]!.isReversed)}</p>
                      </div>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">完整牌义</p>
                        <p className="draw-result-interpret__text">{getMeaningPreview(picked[0]!.card, picked[0]!.isReversed, 200)}</p>
                        <Link href={cardMeaningPagePath(picked[0]!.card.id, picked[0]!.isReversed, { from: pathname })} className="draw-result-full-meaning-link">
                          阅读完整牌义 →
                        </Link>
                      </div>
                    </div>
                  ) : spread === "single" ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">要点</p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                          {(picked[0]!.card.keywords ?? []).slice(0, 8).map((k) => (
                            <span key={k} className="draw-kw-chip">
                              {k}
                            </span>
                          ))}
                        </div>
                        <p className="draw-result-interpret__text">{oneLineConclusion(questionType, picked[0]!.card, picked[0]!.isReversed)}</p>
                      </div>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">接下来</p>
                        <p className="draw-result-interpret__text">{coreTip(questionType, picked[0]!.card, picked[0]!.isReversed)}</p>
                        <p className="draw-result-interpret__sub">{doNow(questionType, picked[0]!.card, picked[0]!.isReversed)}</p>
                      </div>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">留意</p>
                        <p className="draw-result-interpret__text">{avoidToday(questionType, picked[0]!.isReversed)}</p>
                      </div>
                      <div className="draw-result-interpret">
                        <p className="draw-result-interpret__label">完整牌义</p>
                        <p className="draw-result-interpret__text">{getMeaningPreview(picked[0]!.card, picked[0]!.isReversed, 200)}</p>
                        <Link href={cardMeaningPagePath(picked[0]!.card.id, picked[0]!.isReversed, { from: pathname })} className="draw-result-full-meaning-link">
                          阅读完整牌义 →
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {immersivePick && isDrawFeature && (
            <div className="cream-inner-card cream-inner-card--row" style={{ marginTop: 18, justifyContent: "center" }}>
              <button type="button" onClick={() => reset()} className="btn-tarot-secondary" style={{ padding: "10px 18px", fontSize: 14, fontWeight: 800 }}>
                重新问牌
              </button>
              <button type="button" onClick={() => void copyDrawResult()} className="btn-tarot-secondary" style={{ padding: "10px 18px", fontSize: 14, fontWeight: 800 }}>
                {copied ? "已复制" : "复制结果"}
              </button>
            </div>
          )}
        </div>
      ) : immersivePick ? (
        <div
          key={`imm-deck-${transitionKey}`}
          className="draw-pick-immersive-main home-cream-root home-cream-panel draw-pick-immersive-shell"
          style={{
            position: "relative",
            width: "100%",
            minHeight: "calc(100dvh - 3.25rem)",
            /* 顶部留白由全站 main 统一控制；沉浸选牌这里不要再叠加 */
            paddingTop: 0,
            paddingBottom: 12,
            animation: "fadeUp 220ms ease-out",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {phase === "idle" && (
            <button
              type="button"
              onClick={() => start()}
              className="cream-inner-card cream-stage-card"
              aria-label="开始洗牌"
              style={{
                flex: 1,
                minHeight: 420,
                cursor: "pointer",
                border: "1px solid var(--cream-line)",
                background: "var(--cream-card)",
                boxShadow:
                  "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 22px 56px -40px rgba(60,45,30,0.14)",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease"
              }}
            />
          )}
          {(phase === "shuffling" || deckPickPhase(phase)) && fanMetrics && deckOptions.length >= pickCount && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                /* 手机端：扇面整体垂直居中，避免内容全部靠上 */
                justifyContent: "center",
                paddingTop: 0,
                minHeight: 0,
                position: "relative",
                width: "100%"
              }}
            >
              <div
                className="cream-fan-well"
                style={{
                  position: "relative",
                  width: "100%",
                  /* 必须严格跟随主 card，禁止撑破造成右侧溢出 */
                  maxWidth: "100%",
                  margin: "0 auto",
                  height: fanMetrics.fanH,
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    /* 手机端“靠上”问题：提示气泡稍往下 */
                    top: "18%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 70,
                    width: "min(560px, 92%)",
                    textAlign: "center",
                    pointerEvents: "none"
                  }}
                >
                  <div
                    style={{
                      display: "inline-grid",
                      gap: 6,
                      padding: "10px 14px",
                      borderRadius: 18,
                      border: "1px solid var(--cream-line)",
                      background: "rgba(255, 253, 249, 0.86)",
                      boxShadow: "0 10px 26px -18px rgba(60, 45, 30, 0.16)"
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cream-muted)", fontVariantNumeric: "tabular-nums" }}>
                      已选 {picked.length} / {pickSlotTotal} 张
                    </div>
                    <div className="home-cream-lead" style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>
                      {selectionHint(spread, picked.length, phase)}
                    </div>
                  </div>
                </div>

                {pickToResultBridge && (
                  <div className="pick-to-result-bridge" aria-live="polite" role="status">
                    <span className="pick-to-result-bridge__glyph" aria-hidden="true">
                      ✦
                    </span>
                    <span className="pick-to-result-bridge__text">牌已选定，正在生成解读…</span>
                  </div>
                )}
                <div
                  className={`daily-fan-stage tarot-fan-ambient tarot-fan-ambient--top${phase === "shuffling" ? " draw-fan-shuffle-wobble" : ""}`}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    touchAction: "manipulation"
                  }}
                >
                  {phase === "leaving" && picked.length > 0 ? (
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "52%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        width: "min(720px, 92%)"
                      }}
                    >
                      {picked.map((p) => (
                        <div
                          key={`leaving-${p.position}-${p.card.id}`}
                          style={{
                            width: Math.min(138, Math.round(fanMetrics.cw * 0.68)),
                            aspectRatio: "2 / 3",
                            borderRadius: 16,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.55)",
                            border: "1px solid var(--cream-line)",
                            boxShadow: "0 18px 48px -34px rgba(60,45,30,0.24)"
                          }}
                        >
                          <img
                            src={`/cards/${p.card.id}.jpg`}
                            data-fallback-stage="jpg"
                            onError={withCardFallback(p.card.id, p.card.nameCn)}
                            alt={p.card.nameCn}
                            width={260}
                            height={390}
                            style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    Array.from({ length: pickCount }, (_, i) => {
                    const { half, maxAngle, cw, ch, radiusPx } = fanMetrics;
                    const rel = i - half;
                    const { angle, lift, tx } = fanSlotTransform({
                      half,
                      rel,
                      maxAngle,
                      radiusPx,
                      verticalAnchor: FAN_VERTICAL_ANCHOR
                    });
                    const zBase = Math.round(100 - Math.abs(rel) * 3.2);
                    const isPicked = pickedIdxs.includes(i);
                    const isFlipped = flippedIdxs.includes(i);
                    const br = Math.max(8, Math.round(cw * 0.09));
                    const layout = fanCardLayoutStyle(FAN_VERTICAL_ANCHOR, tx, lift, angle);
                    const revealLift = revealingPickIndex === i ? -12 : 0;
                    const fanOpacity = isPicked && phase !== "leaving" ? 0.62 : 1;
                    const z = phase === "leaving" && isPicked ? zBase + 80 : zBase;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pickOne(i)}
                        disabled={phase !== "selecting" || pickToResultBridge}
                        className={`tarot-pick-card${phase === "leaving" && !isPicked ? " pick-slot-leaving-fade" : ""}`}
                        style={{
                          position: "absolute",
                          left: "50%",
                          width: cw,
                          height: ch,
                          marginLeft: -cw / 2,
                          padding: 0,
                          border: "none",
                          background: "none",
                          cursor: phase === "selecting" && !pickToResultBridge ? "pointer" : "default",
                          ...layout,
                          transform: `${layout.transform} translateY(${revealLift}px)`,
                          zIndex: z,
                          transition:
                            "transform 0.42s cubic-bezier(0.25, 0.85, 0.25, 1), opacity 0.85s ease, filter 0.42s ease",
                          opacity: fanOpacity,
                          filter: isPicked && phase !== "leaving" ? "saturate(0.92)" : undefined
                        }}
                        aria-label={`点选第 ${i + 1} 张牌`}
                      >
                        <div
                          className="tarot-perspective"
                          style={{
                            width: cw,
                            height: ch,
                            filter: "drop-shadow(0 12px 22px rgba(60, 45, 30, 0.15))"
                          }}
                        >
                          <div
                            className="tarot-card3d"
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: br,
                              transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
                              transition: "transform 680ms cubic-bezier(.2,.8,.2,1)"
                            }}
                          >
                            <div
                              className="tarot-face"
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: br,
                                overflow: "hidden",
                                border: "1px solid rgba(140, 110, 70, 0.32)",
                                background: "var(--ui-card-face-bg)"
                              }}
                            >
                              <TarotCardBackOrnate width={cw} height={ch} />
                            </div>
                            <div className="tarot-face tarot-back" style={{ position: "absolute", inset: 0, borderRadius: br, overflow: "hidden" }}>
                              {deckOptions[i] ? (
                                <img
                                  src={`/cards/${deckOptions[i]!.card.id}.jpg`}
                                  data-fallback-stage="jpg"
                                  onError={withCardFallback(deckOptions[i]!.card.id, deckOptions[i]!.card.nameCn)}
                                  alt={deckOptions[i]!.card.nameCn}
                                  width={cw}
                                  height={ch}
                                  style={{ width: cw, height: ch, display: "block", objectFit: "cover" }}
                                />
                              ) : (
                                <div style={{ position: "absolute", inset: 0, background: "var(--ui-overlay)" }} />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          key={`deck-${transitionKey}`}
          className={HOME_SURFACE}
          style={{ animation: "fadeUp 220ms ease-out", position: "relative" }}
        >
          <div style={{ position: "relative" }}>
            {pickToResultBridge && phase === "leaving" && (
              <div className="pick-to-result-bridge pick-to-result-bridge--compact" aria-live="polite" role="status">
                <span className="pick-to-result-bridge__text">牌已选定，正在生成解读…</span>
              </div>
            )}
            {phase === "shuffling" && (
              <div
                className="draw-shuffle-ritual"
                style={{
                  marginBottom: 14,
                  borderRadius: 16,
                  border: "1px solid var(--ui-border-soft)",
                  background: "var(--ui-muted-box)",
                  padding: 14,
                  color: "var(--ui-mid)",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: "var(--ui-shuffle-dot)",
                      boxShadow: "var(--ui-glow-shadow-sm)"
                    }}
                  />
                  正在洗牌，请稍等…
                </div>
                <div style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>✦ ✦ ✦</div>
              </div>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${spread === "single" ? 5 : 3}, ${deckW}px)`,
                gap: 10,
                alignItems: "center",
                justifyItems: "center",
                justifyContent: "center",
                padding: 4
              }}
              className="draw-pick-grid"
            >
              {Array.from({ length: pickCount }).map((_, i) => {
                const isSpread = deckPickPhase(phase);
                const isShuffling = phase === "shuffling";
                const rot = isShuffling ? (i % 2 === 0 ? 10 : -10) : 0;
                const liftBase = isSpread ? -2 : 0;
                const revealLift = revealingPickIndex === i ? -8 : 0;
                const lift = liftBase + revealLift;
                const shuffleX = isShuffling ? (i % 3 - 1) * 16 : 0;
                const shuffleY = isShuffling ? (i % 2 === 0 ? -8 : 8) : 0;
                const scale = isSpread ? 1 : isShuffling ? 1.02 : 0.98;
                const isPicked = pickedIdxs.includes(i);
                const isFlipped = flippedIdxs.includes(i);
                const gridOpacity =
                  phase === "leaving" && !isPicked ? 0 : isPicked && phase !== "leaving" ? 0.55 : isSpread ? 1 : isShuffling ? 0.95 : 0.58;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickOne(i)}
                    disabled={phase !== "selecting" || pickToResultBridge}
                    className={`tarot-pick-card${phase === "leaving" && !isPicked ? " pick-slot-leaving-fade" : ""}`}
                    style={{
                      width: deckW,
                      height: deckH,
                      borderRadius: 16,
                      border: "1px solid var(--ui-border)",
                      background: "transparent",
                      boxShadow: "var(--ui-glow-shadow)",
                      cursor: phase === "selecting" && !pickToResultBridge ? "pointer" : "default",
                      opacity: phase === "leaving" && !isPicked ? undefined : gridOpacity,
                      transform: `translate(${shuffleX}px, ${lift + shuffleY}px) rotate(${rot}deg) scale(${scale})`,
                      transition: "transform 520ms cubic-bezier(.2,.8,.2,1), opacity 0.85s ease",
                      position: "relative",
                      zIndex: phase === "leaving" && isPicked ? 5 : undefined
                    }}
                    aria-label={`点选第 ${i + 1} 张牌`}
                  >
                  <div className="tarot-perspective" style={{ position: "absolute", inset: 0 }}>
                    <div
                      className="tarot-card3d"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 16,
                        transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
                        transition: "transform 680ms cubic-bezier(.2,.8,.2,1)"
                      }}
                    >
                      <div
                        className="tarot-face"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 16,
                          border: "1px solid var(--ui-border)",
                          background: "var(--ui-card-face-bg)",
                          overflow: "hidden"
                        }}
                      >
                        <TarotCardBackOrnate width={deckW} height={deckH} />
                      </div>
                      <div className="tarot-face tarot-back" style={{ position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden" }}>
                        {deckOptions[i] ? (
                          <img
                            src={`/cards/${deckOptions[i]!.card.id}.jpg`}
                            data-fallback-stage="jpg"
                            onError={withCardFallback(deckOptions[i]!.card.id, deckOptions[i]!.card.nameCn)}
                            alt={deckOptions[i]!.card.nameCn}
                            width={deckW}
                            height={deckH}
                            style={{ width: deckW, height: deckH, display: "block", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ position: "absolute", inset: 0, background: "var(--ui-overlay)" }} />
                        )}
                      </div>
                    </div>
                  </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 10, display: "grid", justifyItems: "center", gap: 10, textAlign: "center", fontSize: 12, color: "var(--ui-body)" }}>
            <div>
              {phase === "idle"
                ? pickOnly
                  ? "正在准备牌阵…"
                  : "先完成上方选择，然后点击“开始抽牌”进入选牌页。"
                : deckPickPhase(phase) || phase === "shuffling"
                  ? selectionHint(spread, picked.length, phase)
                  : ""}
            </div>
          </div>
        </div>
      )}

      {!immersivePick && (
        <div className={HOME_SURFACE}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--ui-body)" }}>本次抽牌已写入本机历史。</span>
            <Link href="/history" className="ios-chip ios-chip-active" style={{ textDecoration: "none", fontSize: 13, fontWeight: 800 }}>
              历史记录 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

