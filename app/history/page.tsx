"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bodyTextStyle, ghostLinkStyle, HOME_SURFACE, PageIntro, PageSection, PageShell, sectionHeadingStyle } from "@/components/homeLayout";
import cards from "@/data/cards.json";
import { clearDrawForDate, getDrawByStorageKey, listDrawKeys, type StoredRecord } from "@/lib/drawStorage";
import { clearFeedbackEntry } from "@/lib/feedbackStorage";
import { getMeaning } from "@/lib/fortune";

type TarotCard = (typeof cards)[number];

function getCardById(id: string) {
  return (cards as TarotCard[]).find((c) => c.id === id) ?? null;
}

function formatTitle(card: TarotCard, isReversed: boolean) {
  return `${card.nameCn}${isReversed ? "（逆位）" : "（正位）"}`;
}

function recordMain(record: StoredRecord) {
  if ("picks" in record) {
    const first = record.picks[0];
    const card = first ? getCardById(first.cardId) : null;
    return card ? { card, isReversed: !!first!.isReversed, spread: record.type } : null;
  }
  const card = getCardById(record.cardId);
  return card ? { card, isReversed: record.isReversed, spread: "single" as const } : null;
}

function spreadLabel(spread: string) {
  if (spread === "single") return "单张牌";
  if (spread === "three") return "现状/阻碍/建议";
  if (spread === "love3") return "爱情三牌";
  if (spread === "career3") return "事业三牌";
  return spread;
}

function recordText(record: StoredRecord) {
  const lines: string[] = [];
  const { drawnAt, question, questionType, mood } = record;
  const spread = "picks" in record ? record.type : "single";
  lines.push(`牌阵：${spread}`);
  if (mood) lines.push(`抽牌前状态：${mood}`);
  if (questionType) lines.push(`类型：${questionType}`);
  if (question) lines.push(`问题：${question}`);
  if (drawnAt) lines.push(`时间：${new Date(drawnAt).toLocaleString("zh-CN")}`);
  lines.push("");

  const picks = "picks" in record ? record.picks : [{ position: "今日建议", cardId: record.cardId, isReversed: record.isReversed }];
  for (const p of picks) {
    const c = getCardById(p.cardId);
    if (!c) continue;
    lines.push(`${p.position}：${formatTitle(c, p.isReversed)} / ${c.nameEn}`);
    lines.push(getMeaning(c, p.isReversed) || "-");
    lines.push("");
  }
  return lines.join("\n").trim();
}

export default function HistoryPage() {
  const [items, setItems] = useState<Array<{ dateKey: string; record: StoredRecord }>>([]);
  const [open, setOpen] = useState<{ dateKey: string; record: StoredRecord } | null>(null);
  const [copied, setCopied] = useState(false);
  const list = useMemo(() => items, [items]);

  function refresh() {
    const keys = listDrawKeys(120);
    const next: Array<{ dateKey: string; record: StoredRecord }> = [];
    for (const k of keys) {
      const dateKey = k.replace(/^tarot:draw:/, "");
      const r = getDrawByStorageKey(k);
      if (r) next.push({ dateKey, record: r });
    }
    setItems(next);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <PageShell>
      <PageIntro title="我的记录" description="记录保存在本机浏览器。点开可复制详情或删除。" />

      <PageSection>
        {list.length === 0 ? (
          <div style={{ ...bodyTextStyle, margin: 0 }}>暂无记录。</div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {list.map((it) => {
              const main = recordMain(it.record);
              const title = main ? `${formatTitle(main.card, main.isReversed)} · ${spreadLabel(main.spread)}` : "未知记录";
              return (
                <button
                  key={it.dateKey}
                  type="button"
                  onClick={() => setOpen(it)}
                  className="w-full text-left transition hover:bg-white/[0.06]"
                  style={{
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.14)",
                    padding: "14px 16px"
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate" style={{ ...sectionHeadingStyle, fontSize: 16 }}>
                        {title}
                      </div>
                      <div style={{ ...bodyTextStyle, margin: "6px 0 0", fontSize: 14, opacity: 0.85 }}>{it.dateKey}</div>
                    </div>
                    <div style={{ ...bodyTextStyle, margin: 0, fontSize: 14, opacity: 0.75 }}>查看 &gt;</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PageSection>

      <div className="flex flex-wrap gap-4">
        <Link href="/" style={ghostLinkStyle}>
          返回抽牌
        </Link>
        <Link href="/favs" style={ghostLinkStyle}>
          收藏牌库 &gt;
        </Link>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="历史记录详情"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            padding: 16,
            display: "grid",
            placeItems: "center"
          }}
        >
          <div
            className={HOME_SURFACE}
            style={{
              width: "min(860px, 100%)",
              maxHeight: "calc(100dvh - 32px)",
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
                <div style={{ fontSize: 14, fontWeight: 900, color: "var(--cream-ink)" }} className="truncate">
                  历史记录 · {open.dateKey}
                </div>
                <div style={{ fontSize: 12, color: "var(--cream-muted)" }}>
                  {new Date(open.record.drawnAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(recordText(open.record));
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1000);
                    } catch {}
                  }}
                  className="ios-chip"
                >
                  {copied ? "已复制" : "复制文本"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDrawForDate(open.dateKey);
                    clearFeedbackEntry(`history:${open.dateKey}`);
                    setOpen(null);
                    refresh();
                  }}
                  className="ios-chip"
                >
                  删除
                </button>
                <button type="button" onClick={() => setOpen(null)} className="ios-chip">
                  关闭
                </button>
              </div>
            </div>
            <div style={{ padding: 20, overflow: "auto", maxHeight: "calc(100dvh - 140px)" }}>
              <pre style={{ whiteSpace: "pre-wrap", ...bodyTextStyle, margin: 0, fontFamily: "ui-monospace, monospace", color: "var(--cream-muted)" }}>
                {recordText(open.record)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

