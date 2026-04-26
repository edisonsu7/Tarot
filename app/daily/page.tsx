import { Suspense } from "react";
import { DrawDeck2 } from "@/components/DrawDeck2";

export const metadata = {
  title: "今日指引",
  description: "每天一张牌，看看今天适合关注什么。"
};

function PickFallback() {
  return (
    <div className="cream-inner-card cream-inner-card--flex" style={{ margin: "12px auto", maxWidth: 420, minHeight: 120 }}>
      <span style={{ fontSize: 15, lineHeight: 1.65, color: "var(--cream-muted)" }}>载入选牌界面…</span>
    </div>
  );
}

export default function DailyPage() {
  return (
    <div className="home-cream-root mx-auto w-full px-1 pb-4 sm:px-2 sm:pb-6">
      <Suspense fallback={<PickFallback />}>
        <DrawDeck2 feature="daily" pickOnly />
      </Suspense>
    </div>
  );
}
