import { getTodayFortune, getMeaning } from "@/lib/fortune";
import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  const fortune = getTodayFortune({ timeZone: "Asia/Shanghai", enableReversed: true });
  return NextResponse.json({
    ...fortune,
    meaning: getMeaning(fortune.card, fortune.isReversed)
  });
}

