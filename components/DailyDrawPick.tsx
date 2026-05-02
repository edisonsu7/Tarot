"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TarotCardBackOrnate } from "@/components/TarotCardBackOrnate";
import { randBool, shuffleInPlace } from "@/lib/dailyDrawHelpers";
import { getDateKeyInTimeZone } from "@/lib/dateKey";
import { getDrawForDate, getOrCreateUserId, saveDrawForDate } from "@/lib/drawStorage";
import cards from "@/data/cards.json";
import type { TarotCard } from "@/lib/dailyDrawHelpers";

const FAN_COUNT = 7;

type Phase = "checking" | "ready" | "picked" | "revealing" | "exiting";

export function DailyDrawPick() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [pickedCard, setPickedCard] = useState<TarotCard | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout); };
  }, []);

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

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function handlePick(slotIndex: number) {
    if (phase !== "ready") return;
    setPickedIndex(slotIndex);
    setPhase("picked");

    const dateKey = getDateKeyInTimeZone(new Date(), "Asia/Shanghai");
    const pool = shuffleInPlace([...(cards as TarotCard[])]);
    const picked = pool[0]!;
    const reversed = randBool();

    saveDrawForDate(dateKey, {
      cardId: picked.id,
      isReversed: reversed,
      drawnAt: new Date().toISOString(),
    });

    setPickedCard(picked);
    setIsReversed(reversed);

    schedule(() => setPhase("revealing"), 300);
    schedule(() => setIsFlipped(true), 620);
    schedule(() => setPhase("exiting"), 1280);
    schedule(() => router.push("/daily/result"), 1560);
  }

  if (phase === "checking") return null;

  const showOverlay = phase === "revealing" || phase === "exiting";

  let hintText = "选择今天的牌";
  if (phase === "picked") hintText = "翻开今天的牌";
  if (phase === "revealing" || phase === "exiting") {
    hintText = isFlipped ? (pickedCard?.nameCn ?? "牌面正在展开……") : "牌面正在展开……";
  }

  return (
    <>
      <div className="ask-fan-root">
        <div
          className={[
            "ask-fan-inner",
            showOverlay ? "ask-fan-inner--hidden" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <p className="ask-fan-hint">{hintText}</p>

          <div className="ask-fan-row">
            {Array.from({ length: FAN_COUNT }, (_, i) => {
              const isPicked = pickedIndex === i;
              const isOther = pickedIndex !== null && !isPicked;
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    "ask-fan-card",
                    `ask-fan-slot-${i}`,
                    isPicked ? "ask-fan-card--picked" : "",
                    isOther ? "ask-fan-card--fade" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handlePick(i)}
                  disabled={phase !== "ready"}
                  aria-label={`选择第 ${i + 1} 张牌`}
                >
                  <span className="ask-fan-card-face">
                    <TarotCardBackOrnate width={200} height={300} />
                  </span>
                </button>
              );
            })}
          </div>

          <p className="ask-fan-sub">今天只有一次</p>
        </div>
      </div>

      {showOverlay && pickedCard && (
        <div
          className={[
            "ask-reveal-overlay",
            phase === "exiting" ? "ask-reveal-overlay--exit" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="ask-reveal-card-wrap">
            <div
              className={[
                "ask-reveal-card-3d",
                isFlipped ? "ask-reveal-card-3d--flipped" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="ask-reveal-face ask-reveal-face--back">
                <TarotCardBackOrnate width={200} height={300} />
              </div>
              <div
                className={[
                  "ask-reveal-face",
                  "ask-reveal-face--front",
                  isReversed ? "ask-reveal-face--reversed" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/cards/${pickedCard.id}.jpg`}
                  alt={pickedCard.nameCn}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: "inherit",
                  }}
                />
              </div>
            </div>
          </div>
          <p className="ask-reveal-hint">
            {phase === "exiting"
              ? "正在整理今日牌意……"
              : isFlipped
              ? pickedCard.nameCn
              : "牌面正在展开……"}
          </p>
        </div>
      )}
    </>
  );
}
