import { Suspense } from "react";
import { CardsGallery } from "@/components/CardsGallery";
import { PageShell } from "@/components/homeLayout";

export const metadata = {
  title: "牌库",
  description: "78 张牌：搜索与花色筛选，点击查看牌义。"
};

export default function CardsPage() {
  return (
    <PageShell>
      {/* 单页只保留一个大的主 card */}
      <section className="home-cream-panel crystal rune sheen" style={{ display: "grid", gap: 16 }}>
        <header style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.25, color: "var(--cream-ink)" }}>牌库</h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--cream-muted)" }}>
            搜索或按花色筛选，点牌查看中文名、英文名、关键词与正逆位含义。
          </p>
        </header>
        <Suspense fallback={<div style={{ fontSize: 15, lineHeight: 1.65, color: "var(--cream-muted)" }}>载入牌库…</div>}>
          <CardsGallery />
        </Suspense>
      </section>
    </PageShell>
  );
}
