import { Suspense } from "react";
import { DrawDeck2 } from "@/components/DrawDeck2";

export const metadata = {
  title: "灵感问牌 · 选牌",
  description: "从牌背中选择你的塔罗牌。"
};

export default function PickPage() {
  return (
    <div className="home-cream-root mx-auto w-full px-1 pb-4 sm:px-2 sm:pb-6">
      <Suspense fallback={null}>
        <DrawDeck2 feature="draw" pickOnly />
      </Suspense>
    </div>
  );
}
