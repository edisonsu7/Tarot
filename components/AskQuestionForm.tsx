"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ASK_QUESTION_KEY = "tarot_ask_question";

export function AskQuestionForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) {
      setError(true);
      return;
    }
    setError(false);
    try {
      localStorage.setItem(ASK_QUESTION_KEY, q);
    } catch {}
    router.push("/ask/draw");
  }

  function handleSkip() {
    try {
      localStorage.setItem(ASK_QUESTION_KEY, "无具体问题");
    } catch {}
    router.push("/ask/draw");
  }

  return (
    <div className="home-cream-root mx-auto w-full px-1 sm:px-2">
      <div className="home-cream-panel">
        <header className="home-cream-head text-center" style={{ paddingTop: 4 }}>
          <p className="home-cream-lead">写下你心中的问题</p>
        </header>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 28,
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError(false);
              }}
              placeholder="例如：我现在面临的选择，应该怎么看待？"
              rows={4}
              maxLength={200}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "none",
                padding: "14px 16px",
                borderRadius: 16,
                border: error
                  ? "1px solid rgba(180, 60, 50, 0.45)"
                  : "1px solid var(--cream-line)",
                background: "var(--ui-input-bg)",
                fontSize: 15,
                lineHeight: 1.65,
                color: "var(--cream-ink)",
                outline: "none",
                fontFamily: "inherit",
              }}
              autoFocus
            />
            {error && (
              <p style={{ margin: 0, fontSize: 13, color: "rgba(160, 60, 50, 0.9)" }}>
                请先写下你的问题
              </p>
            )}
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--cream-muted)",
                opacity: 0.6,
                textAlign: "right",
              }}
            >
              {question.length} / 200
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <button
              type="submit"
              className="btn-tarot-primary"
              style={{ padding: "12px 32px", fontSize: 15 }}
            >
              洗牌，开始问牌 →
            </button>

            <button
              type="button"
              onClick={handleSkip}
              style={{
                background: "none",
                border: "none",
                padding: "4px 0",
                fontSize: 13,
                color: "var(--cream-muted)",
                cursor: "pointer",
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textUnderlineOffset: "3px",
                opacity: 0.7,
                fontFamily: "inherit",
              }}
            >
              不写问题，直接抽牌
            </button>
          </div>

          <p
            style={{
              margin: "2px 0 0",
              fontSize: 13,
              lineHeight: 1.65,
              color: "var(--cream-muted)",
              textAlign: "center",
              opacity: 0.55,
            }}
          >
            不必字斟句酌，写下脑海中浮现的第一句话。
          </p>
        </form>
      </div>
    </div>
  );
}
