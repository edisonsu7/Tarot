import Link from "next/link";
import { bodyTextStyle, PageShell, sectionHeadingStyle } from "@/components/homeLayout";

export const metadata = {
  title: "关于",
  description: "关于牌语 Tarot 的介绍与使用说明。"
};

export default function AboutPage() {
  return (
    <PageShell>
      <section className="home-cream-panel crystal rune sheen" style={{ display: "grid", gap: 20 }}>
        <header style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: "var(--cream-ink)" }}>关于牌语</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--cream-muted)" }}>
            一款以塔罗为媒介的每日自我提醒工具。
          </p>
        </header>

        <section style={{ display: "grid", gap: 8 }}>
          <h2 style={{ ...sectionHeadingStyle }}>它是做什么的</h2>
          <p style={{ ...bodyTextStyle, margin: 0 }}>
            牌语 Tarot 提供两种体验：今日指引每天用算法从 78 张牌中固定抽取一张，陪你开启新的一天；灵感问牌则让你写下当下的问题，随机抽取一张牌，给你一个方向性的提示。
          </p>
        </section>

        <section style={{ display: "grid", gap: 8 }}>
          <h2 style={{ ...sectionHeadingStyle }}>塔罗不是预言</h2>
          <p style={{ ...bodyTextStyle, margin: 0 }}>
            牌语里的解读基于传统韦特牌义与关键词，仅作为一种自我探索的镜子。它帮助你停下来思考，而不是替你做决定。最终做决定的永远是你自己。
          </p>
        </section>

        <section style={{ display: "grid", gap: 8 }}>
          <h2 style={{ ...sectionHeadingStyle }}>牌库</h2>
          <p style={{ ...bodyTextStyle, margin: 0 }}>
            收录完整的 78 张韦特塔罗，包含大阿卡那与四组小阿卡那（权杖、圣杯、宝剑、星币），每张牌有中英文名、关键词与正逆位解读。
            你可以通过{" "}
            <Link href="/ask" style={{ color: "var(--cream-ink)", fontWeight: 600, textUnderlineOffset: 3 }}>
              灵感问牌
            </Link>
            {" "}随机抽取并查看任意一张牌的详细牌义。
          </p>
        </section>

        <p style={{ ...bodyTextStyle, margin: 0 }}>
          数据存储与使用规则详见{" "}
          <Link href="/privacy" style={{ color: "var(--cream-ink)", fontWeight: 600, textUnderlineOffset: 3 }}>
            隐私与数据
          </Link>
          页面。
        </p>

        <p style={{ ...bodyTextStyle, margin: 0, fontStyle: "italic", opacity: 0.6 }}>
          今天的牌，明天的方向。
        </p>
      </section>
    </PageShell>
  );
}
