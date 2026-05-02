import { Suspense } from "react";
import { DailyDrawPick } from "@/components/DailyDrawPick";

export const metadata = {
  title: "今日指引",
  description: "每天一张牌，看看今天适合关注什么。"
};

export default function DailyPage() {
  return (
    <Suspense>
      <DailyDrawPick />
    </Suspense>
  );
}
