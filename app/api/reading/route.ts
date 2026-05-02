import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `你是一个简洁、温和、偏心理提示风格的塔罗解读助手。
你的任务不是预测命运，而是根据用户的问题和抽到的牌，给出一个有启发性的回应。
必须先理解用户问题，再解释牌。
牌义只能作为辅助，不能脱离用户问题。
回答必须具体、自然、像真实人在认真回应问题。
不要玄学过重，不要恐吓，不要绝对化预测。
不要说"你一定会""必然会"。
不要编造确定结果。
中文输出。
语气简洁、温和、清醒。

如果用户问题是职业/工作/offer/跳槽/选哪个工作：
必须围绕职业选择、长期发展、团队氛围、稳定性、成长空间、压力、通勤、薪资、生活平衡来解释。
即使抽到"圣杯十"，也不能只讲家庭幸福，要转译为工作里的团队氛围、长期稳定、价值认同和生活平衡。

如果用户问题是感情/对方/联系/复合/主动联系：
必须围绕沟通时机、关系互动、表达方式、边界感、对方压力、自己的真实目的来解释。

如果用户问题是学习/考试/申请：
必须围绕准备程度、节奏、复盘、执行力、焦虑管理来解释。

如果用户问题是金钱/投资/购买：
必须围绕风险、预算、长期收益、冲动消费、信息确认来解释。

tryList 必须包含 3 条具体建议。
avoidList 必须包含 3 条具体提醒。
每个字段都必须非空。`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    questionSummary: { type: "string" },
    cardResponseTitle: { type: "string" },
    mainReading: { type: "string" },
    tryList: { type: "array", items: { type: "string" } },
    avoidList: { type: "array", items: { type: "string" } },
    oneSentence: { type: "string" },
  },
  required: [
    "questionSummary",
    "cardResponseTitle",
    "mainReading",
    "tryList",
    "avoidList",
    "oneSentence",
  ],
  additionalProperties: false,
};

type CardPayload = {
  nameZh: string;
  nameEn: string;
  orientation: string;
  orientationZh: string;
  keywords: string[];
};

type RequestBody = {
  question: string;
  card: CardPayload;
  mode: string;
};

export type ApiReading = {
  questionSummary: string;
  cardResponseTitle: string;
  mainReading: string;
  tryList: string[];
  avoidList: string[];
  oneSentence: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured. Create .env.local from .env.local.example." },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    const raw = (await req.json()) as Partial<RequestBody>;
    if (!raw.question?.trim() || !raw.card?.nameZh) {
      return NextResponse.json({ error: "Missing question or card" }, { status: 400 });
    }
    body = raw as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { question, card } = body;

  const userMessage =
    `用户的问题：「${question}」\n\n` +
    `抽到的牌：${card.nameZh}（${card.orientationZh}）/ ${card.nameEn}\n` +
    `关键词：${card.keywords.join("、")}\n\n` +
    `请根据用户的问题和这张牌，给出具体、有针对性的解读。`;

  try {
    const client = new OpenAI({ apiKey });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: SYSTEM_PROMPT,
      input: userMessage,
      temperature: 0.7,
      text: {
        format: {
          type: "json_schema",
          name: "tarot_reading",
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
    });

    const data = JSON.parse(response.output_text) as ApiReading;

    if (
      !data.mainReading ||
      !Array.isArray(data.tryList) ||
      !Array.isArray(data.avoidList) ||
      !data.oneSentence
    ) {
      throw new Error("Incomplete API response");
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/reading]", err);
    return NextResponse.json({ error: "OpenAI API call failed" }, { status: 500 });
  }
}
