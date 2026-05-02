"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TarotCardBackOrnate } from "@/components/TarotCardBackOrnate";
import { randBool, shuffleInPlace } from "@/lib/dailyDrawHelpers";
import cards from "@/data/cards.json";
import type { TarotCard } from "@/lib/dailyDrawHelpers";

const ASK_QUESTION_KEY = "tarot_ask_question";
const ASK_RESULT_KEY = "tarot_ask_result";

export type AskResult = {
  cardId: string;
  orientation: "upright" | "reversed";
  question: string;
  drawnAt: string;
};

const FAN_COUNT = 7;

type Phase = "checking" | "ready" | "picked" | "revealing" | "exiting";

export function AskDrawPick() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [question, setQuestion] = useState("");
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [pickedCard, setPickedCard] = useState<TarotCard | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    try {
      const q = localStorage.getItem(ASK_QUESTION_KEY);
      if (q === null) { router.replace("/ask"); return; }
      setQuestion(q || "无具体问题");
      setPhase("ready");
    } catch {
      router.replace("/ask");
    }
  }, [router]);

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function handlePick(slotIndex: number) {
    if (phase !== "ready") return;
    setPickedIndex(slotIndex);
    setPhase("picked");

    const pool = shuffleInPlace([...(cards as TarotCard[])]);
    const picked = pool[0]!;
    const reversed = randBool();

    const result: AskResult = {
      cardId: picked.id,
      orientation: reversed ? "reversed" : "upright",
      question: question || "无具体问题",
      drawnAt: new Date().toISOString(),
    };
    try { localStorage.setItem(ASK_RESULT_KEY, JSON.stringify(result)); } catch {}

    setPickedCard(picked);
    setIsReversed(reversed);

    schedule(() => setPhase("revealing"), 300);
    schedule(() => setIsFlipped(true), 620);
    schedule(() => setPhase("exiting"), 1280);
    schedule(() => router.push("/ask/result"), 1560);
  }

  if (phase === "checking") return null;

  const showOverlay = phase === "revealing" || phase === "exiting";
  const isNoQuestion = question === "无具体问题";
  const displayQuestion =
    !isNoQuestion && question.length > 40
      ? `${question.slice(0, 40)}…`
      : question;

  let hintText = "选择一张牌";
  if (phase === "picked") hintText = "你选择了这张牌";
  if (phase === "revealing" || phase === "exiting") hintText = isFlipped ? (pickedCard?.nameCn ?? "牌面正在展开……") : "牌面正在展开……";

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
          {!isNoQuestion && (
            <p className="ask-fan-question">「{displayQuestion}」</p>
          )}

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

          <p className="ask-fan-sub">
            {isNoQuestion ? "随意抽一张，看看今天的能量" : "专注在你的问题上"}
          </p>
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
              ? "正在整理牌意……"
              : isFlipped
              ? pickedCard.nameCn
              : "牌面正在展开……"}
          </p>
        </div>
      )}
    </>
  );
}
