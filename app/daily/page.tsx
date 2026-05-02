import { Suspense } from "react";
import { SimpleDailyPick } from "@/components/SimpleDailyPick";

export const metadata = {
  title: "今日指引",
  description: "每天一张牌，看看今天适合关注什么。"
};

export default function DailyPage() {
  return (
    <div className="home-cream-root mx-auto w-full px-1 sm:px-2">
      <Suspense>
        <SimpleDailyPick />
      </Suspense>
    </div>
  );
}
