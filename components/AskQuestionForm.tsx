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
    <div className="home-cream-root mx-auto w-full px-3 sm:px-5">
      <div className="result-page-wrap ask-form-page">
        <p className="ask-fan-hint">写下你心中的问题</p>
        <p className="ask-fan-sub">
          不必字斟句酌，写下脑海中浮现的第一句话。
        </p>

        <form className="ask-form" onSubmit={handleSubmit}>
          <div className="ask-form-field">
            <textarea
              className={["ask-form-textarea", error ? "ask-form-textarea--error" : ""].filter(Boolean).join(" ")}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError(false);
              }}
              placeholder="例如：我现在面临的选择，应该怎么看待？"
              maxLength={200}
              autoFocus
            />
            {error && <p className="ask-form-error">请先写下你的问题</p>}
            <p className="ask-form-count">{question.length} / 200</p>
          </div>

          <div className="result-actions-v2">
            <button type="submit" className="result-share-btn">
              洗牌，开始问牌
            </button>
          </div>

          <p className="ask-form-skip-line">
            没有具体问题？
            <button type="button" className="ask-form-skip-embed" onClick={handleSkip}>
              直接抽一张
            </button>
            ，作为今日灵感。
          </p>
        </form>
      </div>
    </div>
  );
}
