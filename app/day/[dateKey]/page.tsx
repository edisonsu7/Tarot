import Link from "next/link";
import { getFortuneForDateKey } from "@/lib/fortune";
import { CardView } from "@/components/CardView";
import { ShareBar } from "@/components/ShareBar";
import { bodyTextStyle, homeCardGap, HOME_SURFACE, homeCardPadding, homeCardRadius, homeCardShadow, PageShell, sectionHeadingStyle } from "@/components/homeLayout";

type PageProps = {
  params: Promise<{ dateKey: string }>;
};

export default async function DayPage({ params }: PageProps) {
  const { dateKey } = await params;
  const fortune = getFortuneForDateKey({
    timeZone: "Asia/Shanghai",
    dateKey,
    enableReversed: true
  });

  return (
    <PageShell>
      <section
        className={HOME_SURFACE}
        style={{
          padding: homeCardPadding,
          borderRadius: homeCardRadius,
          boxShadow: homeCardShadow,
          display: "grid",
          gap: homeCardGap
        }}
      >
        <p style={{ ...bodyTextStyle, margin: 0, fontSize: 14, opacity: 0.8 }}>历史日期</p>
        <h1 style={{ ...sectionHeadingStyle, fontSize: 26 }}>塔罗运势 · {fortune.dateKey}</h1>
        <p style={{ ...bodyTextStyle, margin: 0 }}>这一天的结果同样是确定性的：同一日期永远一致。</p>
      </section>

      <CardView fortune={fortune} />

      <section
        className={HOME_SURFACE}
        style={{
          padding: homeCardPadding,
          borderRadius: homeCardRadius,
          boxShadow: homeCardShadow,
          display: "grid",
          gap: homeCardGap + 6
        }}
      >
        <ShareBar fortune={fortune} />
        <p style={{ ...bodyTextStyle, margin: 0, fontSize: 14, opacity: 0.75 }}>
          回到{" "}
          <Link className="underline decoration-white/25 underline-offset-4 hover:decoration-white/45" href="/">
            今日
          </Link>
          。
        </p>
      </section>
    </PageShell>
  );
}
