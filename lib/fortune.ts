import cards from "@/data/cards.json";
import { getDateKeyInTimeZone } from "@/lib/dateKey";

export type TarotCard = (typeof cards)[number];

export type Fortune = {
  dateKey: string;
  timeZone: string;
  card: TarotCard;
  isReversed: boolean;
};

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isValidDateKey(dateKey: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey);
}

export function getFortuneForDateKey(options: {
  timeZone: string;
  dateKey: string;
  enableReversed: boolean;
}): Fortune {
  const { timeZone, dateKey, enableReversed } = options;
  if (!isValidDateKey(dateKey)) throw new Error("Invalid dateKey format. Expected YYYY-MM-DD.");

  const seedFn = xmur3(`tarot_daily:${timeZone}:${dateKey}`);
  const prng = mulberry32(seedFn());

  const cardIndex = Math.floor(prng() * cards.length);
  const isReversed = enableReversed ? prng() < 0.5 : false;

  return {
    dateKey,
    timeZone,
    card: cards[cardIndex]!,
    isReversed
  };
}

export function getTodayFortune(options?: {
  timeZone?: string;
  date?: Date;
  enableReversed?: boolean;
}): Fortune {
  const timeZone = options?.timeZone ?? "Asia/Shanghai";
  const date = options?.date ?? new Date();
  const enableReversed = options?.enableReversed ?? true;

  const dateKey = getDateKeyInTimeZone(date, timeZone);
  return getFortuneForDateKey({ timeZone, dateKey, enableReversed });
}

export function getMeaning(card: TarotCard, isReversed: boolean) {
  return isReversed ? card.meaningReversed : card.meaningUpright;
}

