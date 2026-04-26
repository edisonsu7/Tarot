export type FeedbackValue = "accurate" | "partial" | "miss";

export const FEEDBACK_OPTIONS: Array<{ value: FeedbackValue; label: string }> = [
  { value: "accurate", label: "准" },
  { value: "partial", label: "部分准" },
  { value: "miss", label: "不准" }
];

const FEEDBACK_KEY = "tarot:feedback";
const FEEDBACK_NOTES_KEY = "tarot:feedbackNotes";
export const FEEDBACK_NOTE_MAX_CHARS = 4000;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadFeedbackMap(): Record<string, FeedbackValue> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, FeedbackValue>;
  } catch {
    return {};
  }
}

function loadNotesMap(): Record<string, string> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(FEEDBACK_NOTES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function persistNotesMap(map: Record<string, string>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(FEEDBACK_NOTES_KEY, JSON.stringify(map));
}

export function getFeedback(id: string): FeedbackValue | null {
  const value = loadFeedbackMap()[id];
  return value === "accurate" || value === "partial" || value === "miss" ? value : null;
}

export function saveFeedback(id: string, value: FeedbackValue) {
  if (!canUseStorage()) return;
  const map = loadFeedbackMap();
  map[id] = value;
  window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event("tarot:feedback-changed"));
}

export function getFeedbackNote(id: string): string {
  const v = loadNotesMap()[id];
  return typeof v === "string" ? v : "";
}

export function saveFeedbackNote(id: string, text: string) {
  if (!canUseStorage()) return;
  const map = loadNotesMap();
  const clipped = text.slice(0, FEEDBACK_NOTE_MAX_CHARS);
  if (!clipped.trim()) delete map[id];
  else map[id] = clipped;
  persistNotesMap(map);
  window.dispatchEvent(new Event("tarot:feedback-changed"));
}

/** Remove quick feedback and narrative note for one record id (e.g. when deleting history). */
export function clearFeedbackEntry(id: string) {
  if (!canUseStorage()) return;
  const fMap = loadFeedbackMap();
  const nMap = loadNotesMap();
  let changed = false;
  if (id in fMap) {
    delete fMap[id];
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fMap));
    changed = true;
  }
  if (id in nMap) {
    delete nMap[id];
    persistNotesMap(nMap);
    changed = true;
  }
  if (changed) window.dispatchEvent(new Event("tarot:feedback-changed"));
}

export function feedbackStats() {
  const values = Object.values(loadFeedbackMap());
  return {
    total: values.length,
    accurate: values.filter((v) => v === "accurate").length,
    partial: values.filter((v) => v === "partial").length,
    miss: values.filter((v) => v === "miss").length
  };
}

export function feedbackNoteCount() {
  return Object.values(loadNotesMap()).filter((s) => typeof s === "string" && s.trim().length > 0).length;
}

