"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { ShareCard, type ShareCardProps } from "@/components/ShareCard";

type Props = ShareCardProps & {
  fallbackText: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
};

function resolveCardFaceUrl(cardId: string): Promise<string> {
  const jpg = `/cards/${cardId}.jpg`;
  const svg = `/cards/${cardId}.svg`;
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(jpg);
    im.onerror = () => resolve(svg);
    im.src = jpg;
  });
}

export function ShareCardButton({ fallbackText, className, children, disabled, ...shareCardProps }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "generating" | "done">("idle");
  const [cardImageSrc, setCardImageSrc] = useState(() => `/cards/${shareCardProps.card.id}.svg`);

  useEffect(() => {
    let cancelled = false;
    void resolveCardFaceUrl(shareCardProps.card.id).then((url) => {
      if (!cancelled) setCardImageSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [shareCardProps.card.id]);

  async function handleShare() {
    if (state === "generating") return;
    setState("generating");

    const el = cardRef.current;
    if (!el) {
      setState("idle");
      return;
    }

    const faceUrl = await resolveCardFaceUrl(shareCardProps.card.id);
    setCardImageSrc(faceUrl);

    const before = el.style.cssText;

    try {
      const imgEl = el.querySelector("img");
      if (imgEl) {
        if (imgEl.src !== faceUrl && typeof window !== "undefined") {
          imgEl.src = faceUrl;
        }
        if (!imgEl.complete) {
          await new Promise<void>((resolve) => {
            imgEl.onload = () => resolve();
            imgEl.onerror = () => resolve();
          });
        }
      }

      /* 离屏 -9999px 在多数浏览器上不会被完整栅格化，html-to-image 易得到黑/空图；捕获前短暂拉入视口 */
      el.style.setProperty("position", "fixed", "important");
      el.style.setProperty("left", "0", "important");
      el.style.setProperty("top", "0", "important");
      el.style.setProperty("z-index", "2147483646", "important");
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("pointer-events", "none", "important");

      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: true,
        backgroundColor: "#faf8f3",
      });

      if (typeof navigator.share === "function") {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], "tarot-card.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "牌语 Tarot" });
            setState("done");
            setTimeout(() => setState("idle"), 1500);
            return;
          }
        } catch {
          // fall through
        }
      }

      const link = document.createElement("a");
      link.download = `tarot-${shareCardProps.card.id}.png`;
      link.href = dataUrl;
      link.click();
      setState("done");
      setTimeout(() => setState("idle"), 1500);
    } catch (err) {
      console.error("[ShareCardButton] toPng/share failed:", err);
      try {
        await navigator.clipboard.writeText(fallbackText);
        setState("done");
        setTimeout(() => setState("idle"), 1500);
      } catch {
        setState("idle");
      }
    } finally {
      el.style.cssText = before;
    }
  }

  const label =
    state === "generating" ? "生成中…" : state === "done" ? "已分享" : (children ?? "分享卡片");

  return (
    <>
      <ShareCard ref={cardRef} {...shareCardProps} cardImageSrc={cardImageSrc} />
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={disabled || state === "generating"}
        className={className}
      >
        {label}
      </button>
    </>
  );
}
