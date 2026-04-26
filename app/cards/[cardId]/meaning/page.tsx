import Link from "next/link";
import cards from "@/data/cards.json";
import { CardMeaningDetailClient } from "@/components/CardMeaningDetailClient";
import { HOME_SURFACE, ghostLinkStyle, PageShell, sectionHeadingStyle } from "@/components/homeLayout";
import { resolveMeaningBack, sanitizeMeaningFromParam } from "@/lib/cardMeaningDetail";

type PageProps = {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ r?: string; reversed?: string; from?: string | string[] }>;
};

export async function generateStaticParams() {
  return (cards as Array<{ id: string }>).map((card) => ({ cardId: card.id }));
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { cardId } = await params;
  const sp = await searchParams;
  const card = cards.find((c) => c.id === cardId);
  const rev = sp?.r === "1" || sp?.reversed === "1";
  if (!card) return { title: "完整牌义" };
  return {
    title: `${card.nameCn}｜完整牌义（${rev ? "逆位" : "正位"}）`,
    description: `${card.nameCn} / ${card.nameEn}：${rev ? "逆位" : "正位"}完整深度释义。`
  };
}

export default async function CardMeaningPage({ params, searchParams }: PageProps) {
  const { cardId } = await params;
  const sp = await searchParams;
  const card = cards.find((c) => c.id === cardId);

  if (!card) {
    return (
      <PageShell>
        <div className={HOME_SURFACE}>
          <h1 style={{ ...sectionHeadingStyle, fontSize: 22 }}>没有找到这张牌</h1>
          <Link className="mt-5 inline-flex" href="/cards" style={ghostLinkStyle}>
            返回牌库
          </Link>
        </div>
      </PageShell>
    );
  }

  const isReversed = sp?.r === "1" || sp?.reversed === "1";
  const rawFrom = sp?.from;
  const fromRaw = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  const back = resolveMeaningBack(fromRaw, card.id);
  const meaningFromPath = sanitizeMeaningFromParam(fromRaw);

  return (
    <CardMeaningDetailClient
      card={card}
      isReversed={isReversed}
      backHref={back.href}
      backLabel={back.label}
      meaningFromPath={meaningFromPath}
    />
  );
}
