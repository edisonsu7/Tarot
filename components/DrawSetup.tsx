"use client";
import { useEffect, useState, useTransition } from "react";
import type { SpreadType } from "@/lib/drawStorage";
import { useRouter } from "next/navigation";
import {
  HOME_SURFACE,
  bodyTextStyle,
  homeCardGap,
  sectionHeadingStyle
} from "@/components/homeLayout";

type QuestionType = "综合" | "感情" | "事业" | "学业";

const QUESTION_TYPES: QuestionType[] = ["综合", "感情", "事业", "学业"];
const DRAFT_KEY = "tarot:drawDraft";

function normalizeQuestionType(raw: unknown): QuestionType {
  const s = String(raw ?? "");
  if (QUESTION_TYPES.includes(s as QuestionType)) return s as QuestionType;
  if (s === "爱情") return "感情";
  return "综合";
}

export function DrawSetup() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("综合");
  const [spread, setSpread] = useState<SpreadType>("single");

  useEffect(() => {
    try {
      const qt = window.localStorage.getItem("tarot:questionType");
      if (qt) setQuestionType(normalizeQuestionType(qt));
      const sp = window.localStorage.getItem("tarot:spread");
      if (sp === "single" || sp === "three") setSpread(sp);
    } catch {}

    // 提前预取选牌页资源，保证从问题页进入更丝滑
    router.prefetch("/draw/pick");
  }, [router]);

  function startPick() {
    try {
      const draft = { question, questionType, spread, createdAt: new Date().toISOString() };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      window.localStorage.setItem("tarot:questionType", questionType);
      window.localStorage.setItem("tarot:spread", spread);
    } catch {}
    startTransition(() => {
      router.push("/draw/pick");
    });
  }

  return (
    <section
      className={HOME_SURFACE}
      style={{
        display: "grid",
        gap: homeCardGap + 10
      }}
    >
      <label className="cream-inner-card" style={{ margin: 0 }}>
        <div style={sectionHeadingStyle}>你的问题</div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如：这件事该怎么推进？"
          style={{
            height: 44,
            borderRadius: 16,
            border: "1px solid rgba(150, 120, 80, 0.28)",
            background: "rgba(255, 255, 255, 0.72)",
            padding: "0 14px",
            color: "var(--cream-ink)",
            outline: "none",
            fontSize: 15,
            lineHeight: 1.5
          }}
        />
        {!question.trim() && <div style={{ ...bodyTextStyle, margin: 0 }}>可不填；未填写时按「综合」解读。</div>}
      </label>

      <div className="cream-inner-card" style={{ margin: 0 }}>
        <div style={{ ...sectionHeadingStyle, marginBottom: 4 }}>问题类型</div>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((qt) => (
            <button key={qt} type="button" onClick={() => setQuestionType(qt)} className={`ios-chip ${questionType === qt ? "ios-chip-active" : ""}`}>
              {qt}
            </button>
          ))}
        </div>
      </div>

      <div className="cream-inner-card" style={{ margin: 0 }}>
        <div style={{ ...sectionHeadingStyle, marginBottom: 4 }}>牌阵</div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setSpread("single")} className={`ios-chip ${spread === "single" ? "ios-chip-active" : ""}`}>
            单张牌
          </button>
          <button type="button" onClick={() => setSpread("three")} className={`ios-chip ${spread === "three" ? "ios-chip-active" : ""}`}>
            三张牌
          </button>
          <span style={{ ...bodyTextStyle, fontSize: 13, color: "var(--cream-muted)", opacity: 0.92 }}>（单张更快；三张更清晰）</span>
        </div>
      </div>

      <div className="cream-inner-card" style={{ display: "flex", flexDirection: "column", gap: 16, margin: 0 }}>
        <div className="min-w-0" style={{ ...bodyTextStyle, margin: 0 }}>
          默念问题，准备好后进入选牌。
        </div>
        <button
          type="button"
          onClick={startPick}
          className="btn-tarot-primary"
          style={{
            width: "fit-content",
            borderRadius: 9999,
            padding: "12px 22px",
            fontSize: 15,
            fontWeight: 900
          }}
        >
          开始选牌 →
        </button>
      </div>
    </section>
  );
}
