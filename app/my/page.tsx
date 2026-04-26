import { MyPanel } from "@/components/MyPanel";
import { PageIntro, PageShell } from "@/components/homeLayout";

export const metadata = {
  title: "我的",
  description: "历史记录与收藏牌。"
};

export default function MyPage() {
  return (
    <PageShell>
      <PageIntro title="我的" description="历史记录与收藏牌。" />
      <MyPanel />
    </PageShell>
  );
}
