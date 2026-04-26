"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import cards from "@/data/cards.json";
import { HOME_SURFACE } from "@/components/homeLayout";

type TarotCard = (typeof cards)[number];

const FAV_KEY = "tarot:favs";
const READINGS_KEY = "tarot:readings";
const SFX_KEY = "tarot:sfx";

type ReadingPick = {
  cardId?: string;
  position?: string;
  nameCn?: string;
  nameEn?: string;
  isReversed?: boolean;
};

type ReadingPayloadLoose = {
  picks?: ReadingPick[];
  mood?: string;
  questionType?: string;
  question?: string;
  spread?: string;
  dateKey?: string;
  timeZone?: string;
  drawnAt?: string;
};

type StoredReading = {
  id: string;
  dateKey: string;
  title: string;
  payload: ReadingPayloadLoose;
  savedAt: string;
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatReadingText(payload: ReadingPayloadLoose) {
  const picks = Array.isArray(payload.picks) ? payload.picks : [];
  const lines: string[] = [];
  if (payload.mood) lines.push(`抽牌前状态：${payload.mood}`);
  if (payload.questionType) lines.push(`类型：${payload.questionType}`);
  if (payload.question) lines.push(`问题：${payload.question}`);
  if (payload.spread) lines.push(`牌阵：${payload.spread}`);
  if (payload.dateKey) lines.push(`日期：${payload.dateKey}`);
  if (payload.timeZone) lines.push(`时区：${payload.timeZone}`);
  if (payload.drawnAt) lines.push(`时间：${new Date(payload.drawnAt).toLocaleString("zh-CN")}`);
  lines.push("");
  for (const p of picks) {
    const card = (cards as TarotCard[]).find((c) => c.id === (p.cardId ?? ""));
    const nameCn = card?.nameCn ?? p.nameCn ?? p.cardId;
    const nameEn = card?.nameEn ?? p.nameEn ?? "";
    const meaning = card ? (p.isReversed ? card.meaningReversed : card.meaningUpright) : "";
    lines.push(`${p.position}：${nameCn}${p.isReversed ? "（逆位）" : "（正位）"}${nameEn ? ` / ${nameEn}` : ""}`);
    if (meaning) lines.push(meaning);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function MobileHub() {
  const [open, setOpen] = useState(false);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [readings, setReadings] = useState<StoredReading[]>([]);
  const [sfx, setSfx] = useState(true);
  const [detail, setDetail] = useState<StoredReading | null>(null);
  const [copied, setCopied] = useState(false);
  const [dailyDone, setDailyDone] = useState(false);

  const favCards: TarotCard[] = useMemo(() => {
    const map = new Map((cards as TarotCard[]).map((c) => [c.id, c]));
    return favIds.map((id) => map.get(id)).filter(Boolean) as TarotCard[];
  }, [favIds]);

  function refresh() {
    const fav = loadJson<unknown>(FAV_KEY, []);
    setFavIds(Array.isArray(fav) ? fav.filter((x): x is string => typeof x === "string") : []);
    const rs = loadJson<StoredReading[]>(READINGS_KEY, []);
    setReadings(Array.isArray(rs) ? rs.slice(0, 50) : []);
    const se = window.localStorage.getItem(SFX_KEY);
    setSfx(se !== "0");
    try {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(
        new Date()
      );
      setDailyDone(!!window.localStorage.getItem(`tarot:draw:${today}`));
    } catch {}
  }

  useEffect(() => {
    refresh();
    const onFav = () => refresh();
    const onRead = () => refresh();
    const onSfx = () => refresh();
    window.addEventListener("tarot:favs-changed", onFav as EventListener);
    window.addEventListener("tarot:readings-changed", onRead as EventListener);
    window.addEventListener("tarot:sfx-changed", onSfx as EventListener);
    return () => {
      window.removeEventListener("tarot:favs-changed", onFav as EventListener);
      window.removeEventListener("tarot:readings-changed", onRead as EventListener);
      window.removeEventListener("tarot:sfx-changed", onSfx as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    refresh();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ios-glass fixed bottom-4 right-4 z-50 grid h-12 w-12 place-items-center rounded-2xl text-base"
        aria-label="打开工具"
        title="工具"
        style={{ color: "var(--cream-ink)" }}
      >
        ☰
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="工具"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            padding: 14,
            display: "grid",
            placeItems: "end center"
          }}
        >
          <div
            className={HOME_SURFACE}
            style={{
              width: "min(720px, 100%)",
              maxHeight: "calc(100dvh - 28px)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: 14,
                borderBottom: "1px solid var(--cream-line)"
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--cream-ink)" }}>工具</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const url = window.location.href;
                      if (navigator.share) await navigator.share({ title: document.title, url });
                      else await navigator.clipboard.writeText(url);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 900);
                    } catch {}
                  }}
                  className="ios-chip"
                >
                  {copied ? "已完成" : "分享/复制链接"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.localStorage.setItem(SFX_KEY, sfx ? "0" : "1");
                      window.dispatchEvent(new Event("tarot:sfx-changed"));
                    } catch {}
                    setSfx((v) => !v);
                  }}
                  className={`ios-chip ${sfx ? "ios-chip-active" : ""}`}
                >
                  音效{sfx ? "开" : "关"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="ios-chip">
                  关闭
                </button>
              </div>
            </div>

            <div style={{ padding: 14, overflow: "auto" }}>
              <div className="grid gap-4">
                <section className="cream-inner-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cream-ink)" }}>今日指引</div>
                      <div style={{ fontSize: 12, color: "var(--cream-muted)", marginTop: 4 }}>{dailyDone ? "今天已完成" : "点一下直接开始（每日锁定）"}</div>
                    </div>
                    <Link
                      href="/daily?autostart=1"
                      className={`ios-chip ${dailyDone ? "" : "ios-chip-active"}`}
                      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
                    >
                      <span>☾</span>
                      {dailyDone ? "查看" : "开始"}
                    </Link>
                  </div>
                </section>

                <section className="cream-inner-card">
                  <div className="flex items-baseline justify-between gap-3">
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cream-ink)" }}>已保存的占卜</div>
                    <div style={{ fontSize: 12, color: "var(--cream-muted)" }}>{readings.length} 条</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <Link className="ios-chip" href="/my" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      我的 &gt;
                    </Link>
                    <Link className="ios-chip" href="/history" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      我的记录 &gt;
                    </Link>
                    <Link className="ios-chip" href="/favs" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      收藏牌库 &gt;
                    </Link>
                  </div>
                  {readings.length === 0 ? (
                    <div className="mt-3 text-sm" style={{ color: "var(--cream-muted)" }}>
                      在结果里点“保存本次占卜”。
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      {readings.slice(0, 8).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setDetail(r)}
                          className="cream-list-row w-full text-left"
                          style={{
                            borderRadius: 16,
                            border: "1px solid var(--cream-line)",
                            background: "rgba(255,255,255,0.45)",
                            padding: "10px 12px"
                          }}
                        >
                          <div className="truncate text-sm font-semibold" style={{ color: "var(--cream-ink)" }}>
                            {r.title}
                          </div>
                          <div className="text-xs" style={{ color: "var(--cream-muted)" }}>
                            {r.dateKey}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className="cream-inner-card">
                  <div className="flex items-baseline justify-between gap-3">
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--cream-ink)" }}>收藏的牌</div>
                    <div style={{ fontSize: 12, color: "var(--cream-muted)" }}>{favCards.length} 张</div>
                  </div>
                  {favCards.length === 0 ? (
                    <div className="mt-3 text-sm" style={{ color: "var(--cream-muted)" }}>
                      去牌库点开详情弹窗，点“收藏”。
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      {favCards.slice(0, 10).map((c) => (
                        <Link
                          key={c.id}
                          href={`/cards?q=${encodeURIComponent(c.nameCn)}`}
                          className="cream-list-row"
                          style={{
                            borderRadius: 16,
                            border: "1px solid var(--cream-line)",
                            background: "rgba(255,255,255,0.45)",
                            padding: "10px 12px",
                            textDecoration: "none"
                          }}
                        >
                          <div className="text-sm font-semibold" style={{ color: "var(--cream-ink)" }}>
                            {c.nameCn}
                          </div>
                          <div className="text-xs" style={{ color: "var(--cream-muted)" }}>
                            {c.nameEn}
                          </div>
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            window.localStorage.setItem(FAV_KEY, JSON.stringify([]));
                            window.dispatchEvent(new Event("tarot:favs-changed"));
                          } catch {}
                          refresh();
                        }}
                        className="ios-chip"
                      >
                        清空收藏
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="占卜详情"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            padding: 14,
            display: "grid",
            placeItems: "center"
          }}
        >
          <div
            className={HOME_SURFACE}
            style={{
              width: "min(860px, 100%)",
              maxHeight: "calc(100dvh - 28px)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: 14,
                borderBottom: "1px solid var(--cream-line)"
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: 14, fontWeight: 900, color: "var(--cream-ink)" }}>
                  {detail.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--cream-muted)" }}>{detail.dateKey}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(formatReadingText(detail.payload));
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 900);
                    } catch {}
                  }}
                  className="ios-chip"
                >
                  {copied ? "已复制" : "复制文本"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const next = loadJson<StoredReading[]>(READINGS_KEY, []).filter((x) => x.id !== detail.id);
                      window.localStorage.setItem(READINGS_KEY, JSON.stringify(next));
                      window.dispatchEvent(new Event("tarot:readings-changed"));
                    } catch {}
                    setDetail(null);
                  }}
                  className="ios-chip"
                >
                  删除
                </button>
                <button type="button" onClick={() => setDetail(null)} className="ios-chip">
                  关闭
                </button>
              </div>
            </div>
            <div style={{ padding: 14, overflow: "auto" }}>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: "20px", color: "var(--cream-muted)" }}>
                {formatReadingText(detail.payload)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

