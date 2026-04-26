"use client";

import { useEffect, useMemo, useState } from "react";
import type { Fortune } from "@/lib/fortune";
import { getMeaning } from "@/lib/fortune";

function buildShareText(fortune: Fortune) {
  const title = `${fortune.card.nameCn}${fortune.isReversed ? "（逆位）" : "（正位）"}`;
  const oneLine = getMeaning(fortune.card, fortune.isReversed);
  const link = typeof window !== "undefined" ? window.location.href : "";
  return `今天的塔罗：${title}\n${oneLine}\n${link}`.trim();
}

export function ShareBar({ fortune }: { fortune: Fortune }) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [canNativeShare, setCanNativeShare] = useState(false);

  const shareText = useMemo(() => buildShareText(fortune), [fortune]);

  useEffect(() => {
    const nav = navigator as Navigator & { share?: unknown };
    setCanNativeShare(!!nav.share);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied("ok");
      window.setTimeout(() => setCopied("idle"), 1200);
    } catch {
      setCopied("fail");
      window.setTimeout(() => setCopied("idle"), 1200);
    }
  }

  async function nativeShare() {
    const nav = navigator as Navigator & { share?: (data: { text: string; url?: string }) => Promise<void> };
    if (!nav.share) return;
    await nav.share({ text: shareText, url: window.location.href });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-500/30 ring-1 ring-white/10 transition hover:bg-indigo-400"
      >
        {copied === "ok" ? "已复制" : copied === "fail" ? "复制失败" : "复制分享文案"}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-indigo-50/90 transition hover:bg-white/10"
        >
          系统分享
        </button>
      )}
    </div>
  );
}

