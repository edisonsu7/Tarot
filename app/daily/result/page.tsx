import { DailyResultView } from "@/components/DailyResultView";
import { PageShell } from "@/components/homeLayout";

export const metadata = {
  title: "今日指引 · 结果",
  description: "今日抽到的塔罗牌与解读。"
};

export default function DailyResultPage() {
  return (
    <PageShell>
      <DailyResultView />
    </PageShell>
  );
}
