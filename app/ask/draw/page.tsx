import { Suspense } from "react";
import { AskDrawPick } from "@/components/AskDrawPick";

export const metadata = {
  title: "灵感问牌 · 翻牌",
  description: "点击翻开你的塔罗牌。",
};

export default function AskDrawPage() {
  return (
    <Suspense>
      <AskDrawPick />
    </Suspense>
  );
}
