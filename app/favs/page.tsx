"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bodyTextStyle, ghostLinkStyle, PageIntro, PageSection, PageShell, sectionHeadingStyle } from "@/components/homeLayout";
import cards from "@/data/cards.json";

type TarotCard = (typeof cards)[number];

const FAV_KEY = "tarot:favs";

function loadFavIds(): string[] {
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

export default function FavsPage() {
  const [ids, setIds] = useState<string[]>([]);

  const favCards = useMemo(() => {
    const map = new Map((cards as TarotCard[]).map((c) => [c.id, c]));
    return ids.map((id) => map.get(id)).filter(Boolean) as TarotCard[];
  }, [ids]);

  function refresh() {
    setIds(loadFavIds());
  }

  useEffect(() => {
    refresh();
    const onFav = () => refresh();
    window.addEventListener("tarot:favs-changed", onFav as EventListener);
    return () => window.removeEventListener("tarot:favs-changed", onFav as EventListener);
  }, []);

  return (
    <PageShell>
      <PageIntro title="收藏牌库" description="这里是你收藏过的牌。点击会跳到牌库并自动搜索。" />

      <PageSection>
        {favCards.length === 0 ? (
          <div style={{ ...bodyTextStyle, margin: 0 }}>暂无收藏。去牌库点开详情弹窗，点“收藏”。</div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {favCards.map((c) => (
              <Link
                key={c.id}
                href={`/cards?q=${encodeURIComponent(c.nameCn)}`}
                className="transition hover:bg-white/[0.06]"
                style={{
                  borderRadius: 22,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.14)",
                  padding: "14px 16px",
                  textDecoration: "none",
                  color: "inherit"
                }}
              >
                <div style={{ ...sectionHeadingStyle, fontSize: 16 }}>{c.nameCn}</div>
                <div style={{ ...bodyTextStyle, margin: "6px 0 0", fontSize: 14, opacity: 0.85 }}>{c.nameEn}</div>
              </Link>
            ))}
          </div>
        )}

        {favCards.length > 0 && (
          <button
            type="button"
            onClick={() => {
              try {
                window.localStorage.setItem(FAV_KEY, JSON.stringify([]));
                window.dispatchEvent(new Event("tarot:favs-changed"));
              } catch {}
            }}
            className="transition hover:opacity-95"
            style={{
              ...ghostLinkStyle,
              marginTop: 4,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              fontWeight: 700
            }}
          >
            清空收藏
          </button>
        )}
      </PageSection>

      <div className="flex flex-wrap gap-4">
        <Link href="/" style={ghostLinkStyle}>
          返回抽牌
        </Link>
        <Link href="/history" style={ghostLinkStyle}>
          历史记录 &gt;
        </Link>
      </div>
    </PageShell>
  );
}

