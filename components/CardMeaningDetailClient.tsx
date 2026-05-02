"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TarotCard } from "@/lib/fortune";
import { buildCardMeaningDetail, cardMeaningPagePath } from "@/lib/cardMeaningDetail";
import { PageShell, bodyTextStyle, sectionHeadingStyle } from "@/components/homeLayout";

function suitChip(suit: TarotCard["suit"]) {
  switch (suit) {
    case "major":
      return "大阿卡那";
    case "wands":
      return "权杖";
    case "cups":
      return "圣杯";
    case "swords":
      return "宝剑";
    case "pentacles":
      return "星币";
    default:
      return suit;
  }
}

export function CardMeaningDetailClient({
  card,
  isReversed,
  backHref,
  backLabel,
  meaningFromPath
}: {
  card: TarotCard;
  isReversed: boolean;
  backHref: string;
  backLabel: string;
  meaningFromPath: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const sections = useMemo(() => buildCardMeaningDetail(card, isReversed), [card, isReversed]);
  const posLabel = isReversed ? "逆位" : "正位";
  const fromOpt = meaningFromPath ? { from: meaningFromPath } : undefined;
  const element = card.suit === "wands" ? "火" : card.suit === "cups" ? "水" : card.suit === "swords" ? "风" : card.suit === "pentacles" ? "土" : "—";
  const keywords = (card.keywords ?? []).slice(0, 10).filter(Boolean);

  async function copyResult() {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("tarot:lastPickPayload") : null;
      if (raw) {
        const data = JSON.parse(raw) as {
          mode?: string;
          spread?: string;
          question?: string;
          category?: string;
          selectedCards?: Array<{ position: string; cardId: string; orientation: "upright" | "reversed" }>;
          createdAt?: string;
        };
        const lines: string[] = [];
        if (data.question) lines.push(`问题：${data.question}`);
        if (data.category) lines.push(`类型：${data.category}`);
        if (data.createdAt) lines.push(`时间：${new Date(data.createdAt).toLocaleString("zh-CN")}`);
        if (Array.isArray(data.selectedCards) && data.selectedCards.length) {
          lines.push("");
          for (const c of data.selectedCards) {
            lines.push(`${c.position}：${c.cardId}${c.orientation === "reversed" ? "（逆位）" : "（正位）"}`);
          }
        }
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        lines.push("");
        lines.push(`查看完整牌义：${origin}${cardMeaningPagePath(card.id, isReversed, fromOpt ? { from: meaningFromPath } : undefined)}`);
        await navigator.clipboard.writeText(lines.join("\n").trim());
      } else {
        const txt = [`${card.nameCn}（${posLabel}） / ${card.nameEn}`, `牌组：${suitChip(card.suit)} · 元素：${element}`, `关键词：${keywords.join("、") || "-"}`]
          .join("\n")
          .trim();
        await navigator.clipboard.writeText(txt);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  function redraw() {
    try {
      window.localStorage.removeItem("tarot:drawDraft");
      sessionStorage.removeItem("tarot:lastPickPayload");
    } catch {}
    router.push("/ask");
  }

  return (
    <PageShell>
      <div className="mx-auto grid w-full gap-4">
        <section className="cream-inner-card">
          <div className="card-meaning-detail-header">
            <div className="card-meaning-detail-header__img">
              <img
                src={`/cards/${card.id}.jpg`}
                alt={card.nameCn}
                className="aspect-[2/3] w-full rounded-2xl border object-cover"
                style={{ borderColor: "var(--cream-line)" }}
                width={260}
                height={390}
              />
            </div>

              <div className="card-meaning-detail-header__body" style={{ minWidth: 0, display: "grid", gap: 14, alignContent: "start" }}>
                <div style={{ minWidth: 0 }}>
                  <p className="m-0 text-[20px]" style={{ color: "var(--cream-ink)", fontWeight: 600, lineHeight: 1.3 }}>
                    {card.nameCn} {posLabel}
                  </p>
                  <p className="m-0 text-[13px]" style={{ color: "var(--cream-muted)", marginTop: 6, lineHeight: 1.6 }}>
                    {card.nameEn}
                  </p>
                </div>

                <div style={{ minWidth: 0, display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--cream-muted)" }}>{suitChip(card.suit)}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--cream-muted)" }}>{(element === "—" ? "未知" : element) + "元素"}</div>
                </div>

                <div style={{ minWidth: 0, display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--cream-muted)" }}>关键词</div>
                  <div style={{ fontSize: 15, lineHeight: 1.9, color: "var(--cream-ink)" }}>{keywords.length ? keywords.join(" ") : "—"}</div>
                </div>
              </div>
          </div>
        </section>

        {sections.map((sec) => (
          <section key={sec.id} className="cream-inner-card">
            <h2 style={{ ...sectionHeadingStyle, margin: 0, marginBottom: 10 }}>{sec.title}</h2>
            {sec.paragraphs.map((para, i) => (
              <p
                key={i}
                style={{
                  ...bodyTextStyle,
                  margin: i === sec.paragraphs.length - 1 ? 0 : "0 0 12px",
                  lineHeight: 1.72
                }}
              >
                {para}
              </p>
            ))}
          </section>
        ))}

        <div className="result-actions-v2">
          <Link href={backHref} className="result-secondary-btn">
            ← {backLabel}
          </Link>
          <div className="result-actions-links">
            <button type="button" onClick={redraw} className="result-text-link">
              重新问牌
            </button>
            <button type="button" onClick={() => void copyResult()} className="result-text-link">
              {copied ? "已复制" : "复制牌义"}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
