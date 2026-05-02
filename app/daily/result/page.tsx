import { DailyResultView } from "@/components/DailyResultView";

export const metadata = {
  title: "今日指引 · 结果",
  description: "今日抽到的塔罗牌与解读。"
};

export default function DailyResultPage() {
  return (
    <div className="home-cream-root mx-auto w-full px-3 sm:px-5">
      <DailyResultView />
    </div>
  );
}
