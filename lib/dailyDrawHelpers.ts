import type { CSSProperties, SyntheticEvent } from "react";
import cards from "@/data/cards.json";
import { getMeaning } from "@/lib/fortune";

export type TarotCard = (typeof cards)[number];

/** 选牌页扇面张数（与参考图「多牌」一致） */
export const DAILY_FAN_COUNT = 23;

/** 每日选牌页：顶栏 + 提示条 + 区 padding 等，用于 `computeFanLayout` 的可用高度 */
export const DAILY_PICK_LAYOUT_CHROME_PX = 188;
/** 灵感问牌沉浸式选牌：返回链 + 顶留白近似 */
export const DRAW_PICK_LAYOUT_CHROME_PX = 104;

/** 扇面布局（牌宽、弧高、张角），按视口放大以占满大部分屏幕 */
export type FanLayoutMetrics = {
  n: number;
  half: number;
  /** 单侧最大转角（度） */
  maxAngle: number;
  /** 圆弧半径（px）；顶锚点时圆心在弧上方，底锚点时圆心在弧下方 */
  radiusPx: number;
  cw: number;
  ch: number;
  fanH: number;
};

export function computeFanLayout(params: { cardCount: number; viewportW: number; viewportH: number }): FanLayoutMetrics {
  const n = Math.max(1, params.cardCount);
  const vw = Math.max(300, params.viewportW);
  const vh = Math.max(420, params.viewportH);
  const half = (n - 1) / 2;
  const many = n >= 16;
  /**
   * 「大圆弧形」：圆心在牌背上方（顶锚点不变），单侧张角适中、半径尽量大，
   * 即大圆上的一小段浅弧 —— 不靠缩小 R 造深 U。
   */
  const maxAngle = many ? 50 : 44;
  const thetaMax = (maxAngle * Math.PI) / 180;
  const cosT = Math.cos(thetaMax);
  const liftBase = 10;

  const usableW = Math.min(vw, 1920) * 0.98;
  let cw = Math.floor(usableW / (n * 0.392));
  const minCw = vw < 500 ? 62 : 50;
  const maxCw = vw < 500
    ? Math.min(140, Math.floor(vw * 0.38))
    : Math.min(195, Math.floor(vw * 0.3));
  const maxByCardHeight = Math.floor((vh * 0.74) / 1.625);
  cw = Math.max(minCw, Math.min(cw, maxCw, maxByCardHeight));

  const ch = Math.round(cw * 1.625);
  const arcRoom = Math.min(Math.floor(vh * 0.94), 1020) - ch - 68;
  let R = arcRoom / Math.max(0.1, 1 - cosT);
  /** 只按视口收口，不再用「几倍牌高」压 R，否则必成小圆深弧 */
  R = Math.min(R, vw * 0.76, many ? 1600 : 680);
  R = Math.max(160, R);

  const liftEdge = liftBase + R * (1 - cosT);
  /** 旋转后底角会略低于 ch+lift，多留一截；扇面高度上限略放宽以免被 min 压扁裁切 */
  const sinT = Math.sin(thetaMax);
  /** 两侧牌旋转后底角多占的垂直量（弧垂已在 liftEdge 里） */
  const tailPad = 72 + Math.round((cw / 2) * sinT);
  const fanH = Math.min(Math.floor(vh * 0.97), Math.max(Math.floor(vh * 0.52), Math.round(ch + liftEdge + tailPad)));

  return { n, half, maxAngle, radiusPx: R, cw, ch, fanH };
}

/** 扇面贴在容器上沿 / 下沿 */
export type FanVerticalAnchor = "top" | "bottom";
export const FAN_VERTICAL_ANCHOR: FanVerticalAnchor = "top";

/**
 * 顶锚点 + 圆心在弧**上方**：牌顶落在圆的下侧弧上 — lift=10+R·(cosθ−cosθmax)，中间下垂最大、两侧略收；tx=R·sinθ。
 * 底锚点 + 圆心在弧**下方**：lift=10+R·(1−cosθ)，中间最抬升。
 * 转角 = θ（度）：与圆在顶锚点下的切向一致，牌缘顺弧。
 */
export function fanSlotTransform(params: {
  half: number;
  rel: number;
  maxAngle: number;
  radiusPx: number;
  verticalAnchor: FanVerticalAnchor;
}) {
  const maxRel = params.half || 1;
  const t = params.rel / maxRel;
  const thetaMaxRad = (params.maxAngle * Math.PI) / 180;
  const theta = t * thetaMaxRad;
  const R = params.radiusPx;
  const tx = R * Math.sin(theta);
  const cosMax = Math.cos(thetaMaxRad);
  const lift =
    params.verticalAnchor === "top"
      ? 10 + R * (Math.cos(theta) - cosMax)
      : 10 + R * (1 - Math.cos(theta));
  const angle = (theta * 180) / Math.PI;
  return { angle, lift, tx };
}

/** 与 fanSlotTransform 配套的定位与 transform */
export function fanCardLayoutStyle(
  anchor: FanVerticalAnchor,
  tx: number,
  lift: number,
  angle: number
): Pick<CSSProperties, "top" | "bottom" | "transformOrigin" | "transform"> {
  if (anchor === "top") {
    return {
      top: 0,
      bottom: "auto",
      transformOrigin: "50% 0%",
      transform: `translate3d(${tx}px, ${lift}px, 0) rotate(${angle}deg)`
    };
  }
  return {
    top: "auto",
    bottom: 0,
    transformOrigin: "50% 100%",
    transform: `translate3d(${tx}px, -${lift}px, 0) rotate(${angle}deg)`
  };
}

export function randInt(maxExclusive: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
}

export function randBool() {
  return randInt(2) === 0;
}

export function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function getCardById(id: string): TarotCard | null {
  return (cards as TarotCard[]).find((c) => c.id === id) ?? null;
}

export function buildDailyFanOptions(count = DAILY_FAN_COUNT): Array<{ card: TarotCard; isReversed: boolean }> {
  const pool = shuffleInPlace([...(cards as TarotCard[])]).slice(0, count);
  return pool.map((c) => ({ card: c, isReversed: randBool() }));
}

export function formatTitle(card: TarotCard, isReversed: boolean) {
  return `${card.nameCn}${isReversed ? "（逆位）" : "（正位）"}`;
}

export function joinKeywords(card: TarotCard, max = 2) {
  const ks = (card.keywords || []).slice(0, max);
  return ks.length ? ks.join("、") : "当下最重要的一件事";
}

export function oneLineConclusion(card: TarotCard, reversed: boolean) {
  const k = joinKeywords(card, 2);
  if (reversed) return `今天适合先稳住「${k}」相关节奏，不适合在压力下硬推结果。`;
  return `今天适合围绕「${k}」做一个小而确定的行动，不适合反复犹豫。`;
}

export function suitableText(card: TarotCard) {
  const ks = (card.keywords || []).slice(0, 3);
  const list = ks.length ? ks : ['整理', '沟通', '推进'];
  const joined = list.map((k) => `「${k}」`).join('、');
  return `围绕${joined}做轻量推进，写下一个具体计划或完成一件一直在推进的小事，都比较合适。`;
}

export function notSuitableText(card: TarotCard, reversed: boolean) {
  const ks = (card.keywords || []).slice(0, 2);
  if (reversed) {
    return ks.length
      ? `不建议在「${ks[0]}」相关的事上用力过猎，也不要在情绪不稳定时做重大决定。先把节奏稳下来再推进。`
      : `不建议在情绪不稳定时做重大决定，也不要强行推进已经卡住的事情。给自己留一点空间。`;
  }
  return `不建议在情绪高点立刻承诺或做决定，也不要同时开启太多事情而分散精力。先稳住一件再说。`;
}

export { getMeaning };

export function withCardFallback(cardId: string, nameForFallback: string) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const stage = img.dataset.fallbackStage ?? "jpg";
    if (stage === "jpg") {
      img.dataset.fallbackStage = "svg";
      img.src = `/cards/${cardId}.svg`;
      return;
    }
    img.dataset.fallbackStage = "inline";
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="240" height="360" viewBox="0 0 240 360"><rect x="12" y="12" width="216" height="336" rx="16" fill="#f3ece5" stroke="#b88a3d" stroke-width="3"/><text x="120" y="190" font-size="14" fill="#2a221c" text-anchor="middle">${nameForFallback}</text></svg>`
    )}`;
  };
}

export function playTone(params: { type: OscillatorType; from: number; to?: number; durMs: number; vol?: number }, enabled: boolean) {
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

export function sfxShuffle(enabled: boolean) {
  playTone({ type: "triangle", from: 220, to: 120, durMs: 220, vol: 0.03 }, enabled);
}
export function sfxFlip(enabled: boolean) {
  playTone({ type: "sine", from: 880, to: 520, durMs: 140, vol: 0.04 }, enabled);
}
export function sfxPick(enabled: boolean) {
  playTone({ type: "square", from: 660, durMs: 90, vol: 0.02 }, enabled);
}
