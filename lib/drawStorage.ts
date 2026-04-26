export type StoredDraw = {
  cardId: string;
  isReversed: boolean;
  drawnAt: string; // ISO
  question?: string;
  questionType?: string;
  mood?: string;
};

export type StoredPick = {
  cardId: string;
  isReversed: boolean;
  position: string;
};

export type SpreadType = "single" | "three" | "love3" | "career3";

export type StoredSpread = {
  type: SpreadType;
  picks: StoredPick[];
  drawnAt: string; // ISO
  question?: string;
  questionType?: string;
  mood?: string;
};

export type StoredRecord = StoredDraw | StoredSpread;

const USER_ID_KEY = "tarot:userId";
const DRAW_KEY_PREFIX = "tarot:draw:";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getOrCreateUserId() {
  if (!canUseStorage()) return "server";
  const existing = window.localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `u_${Date.now()}_${Math.random()}`;
  window.localStorage.setItem(USER_ID_KEY, id);
  return id;
}

export function getDrawForDate(dateKey: string): StoredRecord | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(`${DRAW_KEY_PREFIX}${dateKey}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredRecord;
  } catch {
    return null;
  }
}

export function saveDrawForDate(dateKey: string, draw: StoredRecord) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(`${DRAW_KEY_PREFIX}${dateKey}`, JSON.stringify(draw));
}

export function clearDrawForDate(dateKey: string) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(`${DRAW_KEY_PREFIX}${dateKey}`);
}

export function listDrawKeys(limit = 60) {
  if (!canUseStorage()) return [] as string[];
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(DRAW_KEY_PREFIX)) keys.push(k);
  }
  keys.sort().reverse();
  return keys.slice(0, limit);
}

export function getDrawByStorageKey(key: string): StoredRecord | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredRecord;
  } catch {
    return null;
  }
}

