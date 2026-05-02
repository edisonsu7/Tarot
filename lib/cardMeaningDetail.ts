import type { TarotCard } from "@/lib/fortune";
import { getMeaning } from "@/lib/fortune";

export type MeaningDetailSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

function suitLabelCn(suit: TarotCard["suit"]): string {
  switch (suit) {
    case "major":
      return "大阿卡那（人生原型与关键转折）";
    case "wands":
      return "权杖牌组（行动、意志、创造与热情）";
    case "cups":
      return "圣杯牌组（情感、关系、直觉与内在需求）";
    case "swords":
      return "宝剑牌组（想法、沟通、边界与真相）";
    case "pentacles":
      return "星币牌组（物质、工作、资源与长期积累）";
    default:
      return "塔罗牌组";
  }
}

function suitFocus(suit: TarotCard["suit"], isReversed: boolean): string {
  const t = isReversed ? "逆位时，能量更容易表现为「受阻、内化、走极端或需要纠偏」。" : "正位时，能量更容易以「可建设、可外显、可推进」的方式呈现。";
  if (suit === "cups") return `情感与关系议题会被放大：你更在意安全感、被理解、以及情绪是否被接住。${t}`;
  if (suit === "swords") return `思考与表达议题会被放大：你更在意信息是否清楚、立场是否一致、以及沟通是否带来解决而非消耗。${t}`;
  if (suit === "pentacles") return `现实与资源议题会被放大：你更在意节奏、回报、可持续性与「值不值得投入」。${t}`;
  if (suit === "wands") return `行动与热情议题会被放大：你更在意动机、勇气、方向感，以及是否愿意为目标承担风险。${t}`;
  return `这张牌往往对应「人生阶段、选择与整合」的主题：它提醒你看见更大的格局，而不是只被眼前细节牵着走。${t}`;
}

/** 用于结果卡片等处的短预览，完整内容见独立页 */
export function getMeaningPreview(card: TarotCard, isReversed: boolean, maxChars = 140): string {
  const raw = (getMeaning(card, isReversed) || "").replace(/\s+/g, " ").trim();
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, maxChars).trim()}…`;
}

/** 仅允许站内相对路径，用作完整牌义页的「返回」来源 */
export function sanitizeMeaningFromParam(raw: string | undefined | null): string {
  if (raw == null || raw === "") return "";
  let s = String(raw).trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    return "";
  }
  if (!s.startsWith("/")) return "";
  if (s.startsWith("//")) return "";
  if (s.includes("..")) return "";
  if (s.includes(":")) return "";
  if (s.length > 160) return "";
  const cut = (x: string) => {
    const q = x.indexOf("?");
    const h = x.indexOf("#");
    let end = x.length;
    if (q >= 0) end = Math.min(end, q);
    if (h >= 0) end = Math.min(end, h);
    return x.slice(0, end);
  };
  const path = cut(s);
  if (!path.startsWith("/")) return "";
  return path;
}

export function resolveMeaningBack(fromRaw: string | undefined | null, cardId: string): { href: string; label: string } {
  const p = sanitizeMeaningFromParam(fromRaw);
  if (!p) return { href: "/daily/result", label: "返回今日结果" };
  if (p === "/") return { href: "/", label: "返回首页" };

  if (p.startsWith("/daily/result")) return { href: "/daily/result", label: "返回今日结果" };
  if (p.startsWith("/daily")) return { href: "/daily", label: "返回今日指引" };
  if (p.startsWith("/ask/result")) return { href: "/ask/result", label: "返回问牌结果" };
  if (p.startsWith("/ask")) return { href: "/ask", label: "返回问牌" };
  if (p.startsWith("/about")) return { href: p.split("#")[0] || "/about", label: "返回说明" };

  return { href: "/daily/result", label: "返回今日结果" };
}

export function cardMeaningPagePath(cardId: string, isReversed: boolean, opts?: { from?: string }): string {
  const from = opts?.from != null && opts.from !== "" ? sanitizeMeaningFromParam(opts.from) : "";
  const params = new URLSearchParams();
  if (isReversed) params.set("r", "1");
  if (from) params.set("from", from);
  const qs = params.toString();
  return `/cards/${cardId}/meaning${qs ? `?${qs}` : ""}`;
}

/**
 * 为每张牌生成「完整牌义」深度长文（模板 + 牌面数据），供独立页面展示。
 * 若日后在 cards.json 增加长字段，可在此优先读取再回退到模板。
 */
export function buildCardMeaningDetail(card: TarotCard, isReversed: boolean): MeaningDetailSection[] {
  const pos = isReversed ? "逆位" : "正位";
  const core = getMeaning(card, isReversed) || "（暂无短释义，可结合牌面关键词自行联想。）";
  const kws = (card.keywords ?? []).filter(Boolean);
  const kwJoin = kws.length ? kws.join("、") : "牌面核心主题";
  const suitLine = suitLabelCn(card.suit);
  const focus = suitFocus(card.suit, isReversed);
  const element =
    card.suit === "wands" ? "火" : card.suit === "cups" ? "水" : card.suit === "swords" ? "风" : card.suit === "pentacles" ? "土" : "—";

  const p1 =
    isReversed
      ? "逆位并不一定是「坏结果」，更多时候是在提醒你：同一张能量如果用力过猛、方向不对、或压抑太久，会以摩擦、拖延、反复、情绪化等方式表现出来。把它当作「校准信号」，而不是判决书。"
      : "正位通常代表这张牌的核心能量处在相对协调的状态：你更容易把它用在建设性方向，也更容易被他人与环境「读懂」。但正位不等于可以不做功课——它更像在给你一张可用的牌，而不是替你打完这一局。";

  const p2 = `把「${kwJoin}」当作阅读线索：它们不是标签，而是你在这段时间里最容易被触发的内在按钮。占卜的意义，是把它们从模糊感受翻译成可讨论、可调整的行动语言。`;

  const workBlock = isReversed
    ? `在工作上，逆位可能表现为：沟通误会、节奏被打乱、承诺超载、或「看起来很忙但没有关键产出」。建议你把问题拆成三件事：① 真正阻塞的是什么；② 哪一步可以外包/协作；③ 哪一步必须亲自收口。把「完成」放在「正确」之前，往往更容易破局。`
    : `在工作上，正位更适合做「对齐」：目标、优先级、责任边界、以及本周唯一的关键交付。若你正在谈判、汇报、转岗或创业，这张牌鼓励你把专业度与可验证结果放在情绪表达之前——用事实建立信任，用节奏建立掌控感。`;

  const loveBlock = isReversed
    ? `在关系与情绪层面，逆位常见信号是：需求说不出口、用冷淡或刺话代替脆弱、把控制误当成关心、或在暧昧与承诺之间反复横跳。你可以先问自己一个更温柔的问题：「我真正害怕失去的是什么？」答案往往比指责更接近修复。`
    : `在关系与情绪层面，正位更像在邀请你：把话说清楚、把边界讲明白、把期待落到可执行的小约定。若你单身，它也可能代表你正在吸引「与你价值观一致」的人；若你在关系中，它强调「一致不是完全相同，而是愿意一起校准方向」。`;

  const spirit =
    isReversed
      ? `在内在成长层面，逆位常提示「旧模式回潮」：你知道更好的做法，但身体与情绪暂时跟不上。这时不必自责，反而更适合做「最小可行改变」：今天只做一件小事，让系统重新相信你能改变。`
      : `在内在成长层面，正位常提示「整合期」：你已经积累了足够经验，现在需要的是把散点连成线。写日记、复盘、与信任的人做一次深度对话，都会让这张牌的能量更落地。`;

  const closing = isReversed
    ? `收束建议：先把强度降下来（睡眠、饮食、信息输入、社交节奏），再用「小步实验」验证方向。塔罗不是替你决定，而是帮你在迷雾里多一盏灯——你仍然拥有选择权。`
    : `收束建议：把这张牌当作「接下来 72 小时」的行动提示：选一个最小动作去完成它，你会更容易在现实中感受到牌面的回应。`;

  return [
    {
      id: "overview",
      title: "牌面总览",
      paragraphs: [
        `「${card.nameCn}」（${card.nameEn}）· ${pos}｜牌组：${suitLine}｜元素：${element}`,
        core,
        p1,
        focus
      ]
    },
    {
      id: "keywords",
      title: "核心关键词",
      paragraphs: [
        `本牌关键词：${kwJoin}。`,
        p2,
        `你可以把关键词当作「检查清单」：今天哪一条被触发了？触发点来自外部事件，还是来自你对自我的期待？`
      ]
    },
    {
      id: "work",
      title: "工作与学业",
      paragraphs: [workBlock]
    },
    {
      id: "relation",
      title: "感情与人际关系",
      paragraphs: [loveBlock]
    },
    {
      id: "inner",
      title: "内在成长提醒",
      paragraphs: [spirit]
    },
    {
      id: "spread",
      title: "实际使用建议",
      paragraphs: [
        `若你用它回答「该怎么做」：先写下你理解的三个关键词（${kwJoin}），再为每个关键词写一句「我今天可以做的最小行动」。`,
        `若你用它回答「对方怎么想 / 关系走向」：把解读从「判断对方」转回「我能掌控的沟通与边界」——稳定来自可重复的一致性与尊重。`,
        closing
      ]
    }
  ];
}
