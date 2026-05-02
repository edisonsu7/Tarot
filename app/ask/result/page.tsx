import { Suspense } from "react";
import { AskResultView } from "@/components/AskResultView";

export const metadata = {
  title: "灵感问牌 · 结果",
  description: "今日抽到的塔罗牌与解读。",
};

export default function AskResultPage() {
  return (
    <div className="home-cream-root mx-auto w-full px-3 sm:px-5">
      <Suspense>
        <AskResultView />
      </Suspense>
    </div>
  );
}
