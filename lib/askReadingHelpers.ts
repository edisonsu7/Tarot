import type { TarotCard } from "@/lib/dailyDrawHelpers";

const NO_QUESTION = "无具体问题";

function hasQ(question?: string): question is string {
  return !!question && question !== NO_QUESTION;
}

export function remindText(card: TarotCard, isReversed: boolean, question?: string): string {
  const kws = (card.keywords ?? []).slice(0, 2);
  const k1 = kws[0] ?? "当下的能量";
  const k2 = kws[1] ?? "内在状态";

  if (hasQ(question)) {
    if (isReversed) {
      return `面对这个问题，「${k1}」的能量目前处于内化或受阻状态。不必强行求解，先稳住节奏，减少在压力下的冲动决定，给自己空间重新看清这件事。`;
    }
    return `面对这个问题，当下「${k1}」的能量相对顺畅。专注在「${k2}」上做一件小而确定的行动，比在脑子里反复推演这个问题更有效。`;
  }

  if (isReversed) {
    return `当下关于「${k1}」的能量处于内化或受阻状态。先稳住节奏，减少在压力下的冲动决定，给自己空间重新校准。`;
  }
  return `当下关于「${k1}」的能量相对顺畅。专注在「${k2}」上做一件小而确定的事，会比反复思考更有效。`;
}

export function tryItems(card: TarotCard, isReversed: boolean, question?: string): string[] {
  const kws = (card.keywords ?? []).slice(0, 3);

  if (hasQ(question)) {
    if (isReversed) {
      return [
        "先把对这个问题的卡点写出来，看清楚究竟是什么在阻碍你",
        "把关于这件事的决定拆成最小可执行的一步，只做这一步",
        kws.length ? `在「${kws[0]}」上给自己一个更温和的空间，不必现在就有答案` : "和一个信任的人聊聊你在这件事上的状态",
      ];
    }
    return [
      "把关于这个问题的思路简短地写下来，哪怕只是一两句",
      kws.length ? `围绕「${kws[0]}」做一个具体的小行动，哪怕只是第一步` : "做一个小而具体的行动，哪怕很微小",
      kws.length > 1 ? `在「${kws[1]}」上清晰表达自己的立场或需求` : "为这件事设定一个最近可以行动的具体时间点",
    ];
  }

  if (isReversed) {
    return [
      "先暂停，把当前的卡点写下来，看清楚究竟是什么在阻碍",
      "把复杂的决定拆成最小可执行的一步，只做这一步",
      kws.length ? `在「${kws[0]}」上给自己一个更温和的空间` : "和一个信任的人说说你现在的状态",
    ];
  }
  return [
    kws.length ? `把「${kws[0]}」相关的思路整理写下来` : "把当下最重要的一件事明确写下来",
    "做一个小而具体的行动，哪怕很微小",
    kws.length > 1 ? `在「${kws[1]}」上清晰表达自己的立场或需求` : "为今天设定一个主要方向，其余事情暂时搁置",
  ];
}

export function avoidItems(card: TarotCard, isReversed: boolean, question?: string): string[] {
  const kws = (card.keywords ?? []).slice(0, 2);

  if (hasQ(question)) {
    if (isReversed) {
      return [
        "避免在情绪不稳定时对这件事做出重大决定",
        kws.length ? `不要在「${kws[0]}」上用力过猛，强行推进这件事` : "不要过度解读这个问题的各种可能性",
        "不要用回避替代真正需要发生的行动或沟通",
      ];
    }
    return [
      "不必反复验证关于这件事的决定是否正确，先走一步再说",
      "避免把这个问题和太多其他事情混在一起想",
      kws.length ? `不要因为害怕在「${kws[0]}」上出错就一直推迟第一步` : "不要因为等待完美答案而迟迟不行动",
    ];
  }

  if (isReversed) {
    return [
      "避免在情绪不稳定时做重大决定",
      kws.length ? `不要在「${kws[0]}」上用力过猛或强行推进` : "不要过度解读当前情况，给自己留点余地",
      "不要用沉默或回避替代真正需要发生的沟通",
    ];
  }
  return [
    "不必反复验证这个决定是否正确，先走一步再说",
    "避免同时开启太多任务，聚焦在一件事上",
    kws.length ? `不要因为害怕在「${kws[0]}」上出错就一直推迟第一步` : "不要因为等待完美时机而迟迟不行动",
  ];
}

export function oneLineSummary(card: TarotCard, isReversed: boolean, question?: string): string {
  const kws = (card.keywords ?? []).slice(0, 1);
  const k = kws[0] ?? "当下";

  if (hasQ(question)) {
    if (isReversed) {
      return `面对这件事，先把「${k}」相关的节奏稳下来，方向会在过程中逐渐清晰——不需要现在就想明白全部。`;
    }
    return `这张牌给这个问题的回应：围绕「${k}」做一个小而确定的行动，而不是继续等待完美答案出现。`;
  }

  if (isReversed) {
    return `这张牌提醒你：先把「${k}」相关的节奏稳下来，方向会在过程中逐渐清晰——不需要现在就想明白全部。`;
  }
  return `这张牌提醒你：围绕「${k}」做一个小而确定的行动，而不是继续等待完美时机出现。`;
}
