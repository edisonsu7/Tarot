"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cardMeaningPagePath } from "@/lib/cardMeaningDetail";
import {
  HOME_SURFACE,
  bodyTextStyle,
  homeCardGap,
  PageShell
} from "@/components/homeLayout";
import cards from "@/data/cards.json";

type TarotCard = (typeof cards)[number];

function suitLabel(suit: TarotCard["suit"]) {
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

export function CardDetailClient({ card }: { card: TarotCard }) {
  const pathname = usePathname() ?? "";
  const fromOpt = { from: pathname };

  return (
    <PageShell>
      <div className="cream-return-bar">
        <div className="cream-inner-card cream-inner-card--row">
          <Link
            href="/cards"
            className="btn-tarot-secondary"
            style={{ padding: "8px 14px", fontSize: 13, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            ← 返回牌库
          </Link>
          <span
            className="cream-meaning-body rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              border: "1px solid var(--cream-line)",
              background: "rgba(255,255,255,0.55)",
              color: "var(--cream-muted)"
            }}
          >
            {suitLabel(card.suit)}
          </span>
        </div>
      </div>

      <div className="card-meaning-detail-header">
        <section className={`card-meaning-detail-header__img ${HOME_SURFACE} overflow-hidden`}>
          <img
            src={`/cards/${card.id}.jpg`}
            alt={card.nameCn}
            className="aspect-[2/3] w-full rounded-2xl border border-white/10 object-cover"
            width={260}
            height={390}
          />
        </section>

        <article className={`card-meaning-detail-header__body ${HOME_SURFACE}`} style={{ display: "grid", gap: homeCardGap + 4 }}>
          <section>
            <h3 className="mb-1.5 text-xs font-semibold text-indigo-100/60">中文名</h3>
            <h1 className="m-0 text-2xl font-bold tracking-tight text-indigo-50/95">{card.nameCn}</h1>
          </section>
          <section>
            <h3 className="mb-1.5 text-xs font-semibold text-indigo-100/60">英文名</h3>
            <p className="m-0 text-base leading-relaxed text-indigo-100/80">{card.nameEn}</p>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold text-indigo-100/60">关键词</h3>
            <div className="flex flex-wrap gap-2">
              {(card.keywords ?? []).length ? (
                (card.keywords ?? []).map((k) => (
                  <span key={k} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-sm text-indigo-50/88">
                    {k}
                  </span>
                ))
              ) : (
                <span className="text-sm text-indigo-100/50">—</span>
              )}
            </div>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold text-indigo-100/60">正位含义</h3>
            <p style={{ ...bodyTextStyle, margin: 0 }}>{card.meaningUpright || "—"}</p>
            <p style={{ margin: "12px 0 0" }}>
              <Link href={cardMeaningPagePath(card.id, false)} className="draw-result-full-meaning-link text-sm">
                完整深度牌义（正位）→
              </Link>
            </p>
          </section>
          <section>
            <h3 className="mb-2 text-xs font-semibold text-indigo-100/60">逆位含义</h3>
            <p style={{ ...bodyTextStyle, margin: 0 }}>{card.meaningReversed || "—"}</p>
            <p style={{ margin: "12px 0 0" }}>
              <Link href={cardMeaningPagePath(card.id, true, fromOpt)} className="draw-result-full-meaning-link text-sm">
                完整深度牌义（逆位）→
              </Link>
            </p>
          </section>
        </article>
      </div>
    </PageShell>
  );
}
