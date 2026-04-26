import Link from "next/link";
import cards from "@/data/cards.json";
import { CardDetailClient } from "@/components/CardDetailClient";
import { ghostLinkStyle, HOME_SURFACE, PageShell, sectionHeadingStyle } from "@/components/homeLayout";

type PageProps = {
  params: Promise<{ cardId: string }>;
};

export async function generateStaticParams() {
  return (cards as Array<{ id: string }>).map((card) => ({ cardId: card.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { cardId } = await params;
  const card = cards.find((c) => c.id === cardId);
  return {
    title: card ? `${card.nameCn}｜牌库` : "牌详情",
    description: card ? `${card.nameCn} / ${card.nameEn}：关键词与正、逆位含义。` : "塔罗牌详情。"
  };
}

export default async function CardDetailPage({ params }: PageProps) {
  const { cardId } = await params;
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

  return <CardDetailClient card={card} />;
}

