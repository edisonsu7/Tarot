import Link from "next/link";
import { bodyTextStyle, PageShell, sectionHeadingStyle } from "@/components/homeLayout";

export const metadata = {
  title: "隐私与数据",
  description: "抽牌规则、数据存储与免责声明。"
};

export default function PrivacyPage() {
  return (
    <PageShell>
      {/* 单页只保留一个大的主 card */}
      <section className="home-cream-panel crystal rune sheen" style={{ display: "grid", gap: 14 }}>
        <header style={{ display: "grid", gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.25, color: "var(--cream-ink)" }}>隐私与数据</h1>
          <p style={{ ...bodyTextStyle, margin: 0 }}>抽牌规则、数据存储与免责声明（已整合）。</p>
        </header>

        <section style={{ display: "grid", gap: 8 }}>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 16, fontWeight: 600 }}>抽牌规则</h2>
          <ul className="list-disc space-y-2 pl-5" style={{ ...bodyTextStyle, margin: 0 }}>
            <li>今日指引每天固定一张牌；灵感问牌用于输入问题、选择类型与单张或三张牌阵。</li>
            <li>牌面可能出现正位/逆位，解读会对应变化。</li>
          </ul>
        </section>

        <section style={{ display: "grid", gap: 8 }}>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 16, fontWeight: 600 }}>数据与隐私</h2>
          <ul className="list-disc space-y-2 pl-5" style={{ ...bodyTextStyle, margin: 0 }}>
            <li>抽牌记录保存在你浏览器的本地存储（localStorage），不需要登录。</li>
            <li>清理浏览器数据或更换设备后，记录会消失。</li>
          </ul>
        </section>

        <section style={{ display: "grid", gap: 8 }}>
          <h2 style={{ ...sectionHeadingStyle, fontSize: 16, fontWeight: 600 }}>免责声明</h2>
          <ul className="list-disc space-y-2 pl-5" style={{ ...bodyTextStyle, margin: 0 }}>
            <li>内容仅供娱乐与自我探索，不构成任何建议或承诺。</li>
            <li>请基于自己的判断做决定；如有需要请寻求专业帮助。</li>
          </ul>
        </section>

        <p style={{ ...bodyTextStyle, margin: 0 }}>
          想浏览全部 78 张牌与关键词？请前往{" "}
          <Link href="/cards" style={{ fontWeight: 600, color: "var(--cream-ink)", textUnderlineOffset: 3 }}>
            牌库
          </Link>
          。
        </p>
      </section>
    </PageShell>
  );
}

