"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TarotCardBackOrnate } from "@/components/TarotCardBackOrnate";
import { getDateKeyInTimeZone } from "@/lib/dateKey";
import { getDrawForDate, getOrCreateUserId, saveDrawForDate } from "@/lib/drawStorage";
import { randBool, shuffleInPlace } from "@/lib/dailyDrawHelpers";
import cards from "@/data/cards.json";
import type { TarotCard } from "@/lib/dailyDrawHelpers";

type Phase = "checking" | "ready" | "flipping" | "done";

export function SimpleDailyPick() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");

  useEffect(() => {
    getOrCreateUserId();
    const dateKey = getDateKeyInTimeZone(new Date(), "Asia/Shanghai");
    const existing = getDrawForDate(dateKey);
    if (existing && !("picks" in existing)) {
      router.replace("/daily/result");
      return;
    }
    setPhase("ready");
  }, [router]);

  function handlePick() {
    if (phase !== "ready") return;
    setPhase("flipping");

    const dateKey = getDateKeyInTimeZone(new Date(), "Asia/Shanghai");
    const pool = shuffleInPlace([...(cards as TarotCard[])]);
    const picked = pool[0]!;
    const isReversed = randBool();

    saveDrawForDate(dateKey, {
      cardId: picked.id,
      isReversed,
      drawnAt: new Date().toISOString(),
    });

    window.setTimeout(() => {
      setPhase("done");
      router.push("/daily/result");
    }, 680);
  }

  if (phase === "checking" || phase === "done") return null;

  return (
    <div className="simple-daily-pick-root">
      <div className="simple-daily-pick-inner">
        <p className="simple-daily-pick-hint">
          {phase === "flipping" ? "翻开……" : "点击翻开今天的牌"}
        </p>

        <div className="simple-daily-card-wrap">
          <button
            type="button"
            className={`simple-daily-card-btn${phase === "flipping" ? " sdp-flipping" : ""}`}
            onClick={handlePick}
            disabled={phase === "flipping"}
            aria-label="翻开今日塔罗牌"
          >
            <div className="simple-daily-card-inner">
              <div className="simple-daily-card-face">
                <TarotCardBackOrnate width={200} height={300} />
              </div>
              <div className="simple-daily-card-face simple-daily-card-face--back" />
            </div>
          </button>
        </div>

        <p className="simple-daily-pick-sub">每天只有一次</p>
      </div>
    </div>
  );
}
