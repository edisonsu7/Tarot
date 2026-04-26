"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import cards from "@/data/cards.json";
import { bodyTextStyle, HOME_SURFACE, homeCardRadius, homeCardShadow } from "@/components/homeLayout";

type TarotCard = (typeof cards)[number];

function normalize(s: string) {
  return s.trim().toLowerCase();
}

/** 牌库网状排序：先按花色链，再按牌面序号（与经典牌阵结构一致）。 */
const SUIT_MESH_ORDER: Record<TarotCard["suit"], number> = {
  major: 0,
  wands: 1,
  cups: 2,
  swords: 3,
  pentacles: 4
};

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

function fallbackSvgDataUrl(text: string) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="720" viewBox="0 0 480 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
  </defs>
  <rect x="24" y="24" width="432" height="672" rx="28" fill="#0b1020" stroke="url(#g)" stroke-width="10"/>
  <path d="M240 160l22 44 48 7-35 33 8 48-43-23-43 23 8-48-35-33 48-7 22-44z" fill="url(#g)"/>
  <text x="240" y="520" font-family="ui-sans-serif, system-ui, -apple-system" font-size="22" fill="#eef2ff" text-anchor="middle">${safe}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
    img.src = fallbackSvgDataUrl(nameForFallback);
  };
}

function CardThumb({ card, onOpen }: { card: TarotCard; onOpen: (card: TarotCard) => void }) {
  return (
    <div
      className="group flex min-w-0 flex-col"
      style={{ minWidth: 0 }}
    >
      <button
        type="button"
        onClick={() => onOpen(card)}
        className="block min-w-0 flex-1 cursor-pointer text-left"
        aria-label={`查看 ${card.nameCn}`}
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border" style={{ borderColor: "var(--cream-line)", background: "rgba(255,255,255,0.18)" }}>
          <img
            src={`/cards/${card.id}.jpg`}
            alt={`${card.nameCn}牌面`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            data-fallback-stage="jpg"
            onError={withCardFallback(card.id, card.nameCn)}
            width={280}
            height={420}
            sizes="(max-width: 560px) 46vw, 30vw"
          />
        </div>
        {/* 只保留底部信息条（不要整张白色底卡） */}
        <div
          className="mt-2 flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5"
          style={{ borderColor: "var(--cream-line)", background: "rgba(255,255,255,0.35)", boxShadow: homeCardShadow }}
        >
          <p className="min-w-0 truncate text-[13px]" style={{ margin: 0, color: "var(--cream-ink)", fontWeight: 600 }}>
            {card.nameCn}
          </p>
          <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: "var(--cream-line)", color: "var(--cream-muted)", background: "rgba(255,255,255,0.35)" }}>
            {suitLabel(card.suit)}
          </span>
        </div>
      </button>
    </div>
  );
}

export function CardsGallery() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [suit, setSuit] = useState<"" | TarotCard["suit"]>("");
  const [open, setOpen] = useState<TarotCard | null>(null);
  const [openIndex, setOpenIndex] = useState<number>(-1);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    return cards.filter((c) => {
      if (suit && c.suit !== suit) return false;
      if (!nq) return true;
      const hay = normalize([c.id, c.nameCn, c.nameEn, c.suit, ...(c.keywords ?? [])].join(" "));
      return hay.includes(nq);
    });
  }, [q, suit]);

  const galleryCards = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const oa = SUIT_MESH_ORDER[a.suit];
        const ob = SUIT_MESH_ORDER[b.suit];
        if (oa !== ob) return oa - ob;
        return a.number - b.number;
      }),
    [filtered]
  );

  function openCard(card: TarotCard) {
    const idx = galleryCards.findIndex((c) => c.id === card.id);
    setOpenIndex(idx);
    setOpen(card);
  }

  function openByIndex(idx: number) {
    const next = galleryCards[idx];
    if (!next) return;
    setOpenIndex(idx);
    setOpen(next);
  }

  useEffect(() => {
    const qp = searchParams?.get("q");
    if (qp) setQ(qp);
  }, [searchParams]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") openByIndex(Math.max(0, openIndex - 1));
      if (e.key === "ArrowRight") openByIndex(Math.min(galleryCards.length - 1, openIndex + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openIndex, galleryCards]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <style>{`
        .cards-gallery-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          width: 100%;
          max-width: 100%;
        }
        @media (max-width: 560px) {
          .cards-gallery-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
          }
        }
      `}</style>
      {/* 外层页面已是单个主 card，这里不再套第二张 card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" style={{ minWidth: 0 }}>
        <label className="flex min-w-0 flex-1 flex-col gap-2">
          <span style={{ ...bodyTextStyle, margin: 0, fontSize: 14, opacity: 0.75 }}>搜索</span>
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="例如：愚人 / The Fool / 开始 / cups"
              className="h-11 w-full rounded-xl border px-3 pr-10 outline-none focus:ring-2"
              style={{ fontSize: 15 }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-lg border text-[12px] transition"
                aria-label="清空搜索"
              >
                ×
              </button>
            )}
          </div>
        </label>

        <div className="flex flex-col gap-2">
          <span style={{ ...bodyTextStyle, margin: 0, fontSize: 14, opacity: 0.75 }}>花色</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSuit("")} className={`ios-chip ${suit === "" ? "ios-chip-active" : ""}`}>
              全部
            </button>
            <button type="button" onClick={() => setSuit("major")} className={`ios-chip ${suit === "major" ? "ios-chip-active" : ""}`}>
              大阿卡那
            </button>
            <button type="button" onClick={() => setSuit("wands")} className={`ios-chip ${suit === "wands" ? "ios-chip-active" : ""}`}>
              权杖
            </button>
            <button type="button" onClick={() => setSuit("cups")} className={`ios-chip ${suit === "cups" ? "ios-chip-active" : ""}`}>
              圣杯
            </button>
            <button type="button" onClick={() => setSuit("swords")} className={`ios-chip ${suit === "swords" ? "ios-chip-active" : ""}`}>
              宝剑
            </button>
            <button
              type="button"
              onClick={() => setSuit("pentacles")}
              className={`ios-chip ${suit === "pentacles" ? "ios-chip-active" : ""}`}
            >
              星币
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:pb-1" style={{ ...bodyTextStyle, margin: 0, fontSize: 14, opacity: 0.8 }}>
          <span>显示 {filtered.length} / {cards.length}</span>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setSuit("");
            }}
            className="rounded-lg border px-3 py-1.5 transition"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            清空
          </button>
        </div>
      </div>

      <div className="cards-gallery-grid" style={{ minWidth: 0 }}>
        {galleryCards.length === 0 ? (
          <div className="col-span-full rounded-2xl border p-6 text-sm" style={{ borderColor: "var(--cream-line)", background: "rgba(255,255,255,0.25)", color: "var(--cream-muted)" }}>
            没有找到匹配的牌。你可以试试更短的关键词，或把花色切回“全部”。
          </div>
        ) : (
          galleryCards.map((card) => <CardThumb key={card.id} card={card} onOpen={openCard} />)
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${open.nameCn} 详情`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            padding: 16,
            display: "grid",
            placeItems: "center",
            animation: "fadeUp 180ms ease-out"
          }}
        >
          <div
            className={`${HOME_SURFACE} flex max-h-[calc(100dvh-32px)] w-full max-w-[520px] flex-col overflow-hidden`}
            style={{ borderRadius: homeCardRadius, boxShadow: homeCardShadow }}
          >
            <div
              className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3"
              style={{ ...bodyTextStyle, margin: 0, fontSize: 13 }}
            >
              <span className="text-indigo-100/70">牌详情</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openByIndex(Math.max(0, openIndex - 1))}
                  disabled={openIndex <= 0}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-bold text-indigo-50 transition hover:bg-white/10 disabled:opacity-40"
                  aria-label="上一张"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => openByIndex(Math.min(galleryCards.length - 1, openIndex + 1))}
                  disabled={openIndex >= galleryCards.length - 1}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-bold text-indigo-50 transition hover:bg-white/10 disabled:opacity-40"
                  aria-label="下一张"
                >
                  ›
                </button>
                <Link
                  href={`/cards/${open.id}`}
                  prefetch={false}
                  onClick={() => setOpen(null)}
                  className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/[0.06] px-3 text-xs font-bold text-indigo-50/95 no-underline transition hover:bg-white/10"
                >
                  独立页
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-base font-bold text-indigo-50 transition hover:bg-white/10"
                  aria-label="关闭"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-4">
              <div className="mx-auto mb-5 max-w-[220px]">
                <img
                  src={`/cards/${open.id}.jpg`}
                  data-fallback-stage="jpg"
                  onError={withCardFallback(open.id, open.nameCn)}
                  alt={open.nameCn}
                  width={220}
                  height={330}
                  className="aspect-[2/3] w-full rounded-2xl border border-white/10 object-cover"
                />
              </div>

              <div className="grid gap-5">
                <section>
                  <h3 className="mb-1.5 text-xs font-semibold text-indigo-100/60">中文名</h3>
                  <p className="text-lg font-bold tracking-tight text-indigo-50/95">{open.nameCn}</p>
                </section>
                <section>
                  <h3 className="mb-1.5 text-xs font-semibold text-indigo-100/60">英文名</h3>
                  <p className="text-sm leading-relaxed text-indigo-100/80">{open.nameEn}</p>
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold text-indigo-100/60">关键词</h3>
                  <div className="flex flex-wrap gap-2">
                    {(open.keywords ?? []).length ? (
                      (open.keywords ?? []).map((k) => (
                        <span
                          key={k}
                          className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-indigo-50/88"
                        >
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
                  <p className="text-[15px] leading-relaxed text-indigo-100/85">{open.meaningUpright || "—"}</p>
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold text-indigo-100/60">逆位含义</h3>
                  <p className="text-[15px] leading-relaxed text-indigo-100/85">{open.meaningReversed || "—"}</p>
                </section>
              </div>

              <p className="mt-6 text-center text-xs text-indigo-100/50">点击背景空白处或按 ESC 关闭</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

