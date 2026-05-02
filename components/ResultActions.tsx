"use client";

import Link from "next/link";
import { ShareCardButton } from "@/components/ShareCardButton";
import type { ShareCardProps } from "@/components/ShareCard";

type ResultActionsProps = {
  shareLabel: string;
  shareCardData: ShareCardProps;
  shareFallbackText: string;
  shareDisabled?: boolean;

  detailHref: string;

  retryLabel: string;
  retryHref?: string;
  onRetry?: () => void;
};

export function ResultActions({
  shareLabel,
  shareCardData,
  shareFallbackText,
  shareDisabled,
  detailHref,
  retryLabel,
  retryHref,
  onRetry,
}: ResultActionsProps) {
  return (
    <div className="result-actions-v2">
      <ShareCardButton
        {...shareCardData}
        fallbackText={shareFallbackText}
        disabled={shareDisabled}
        className="result-share-btn"
      >
        {shareLabel}
      </ShareCardButton>

      <div className="result-actions-links">
        <Link href={detailHref} className="result-text-link">
          了解这张牌
        </Link>
        <span className="result-action-separator">·</span>
        {retryHref ? (
          <Link href={retryHref} className="result-text-link">
            {retryLabel}
          </Link>
        ) : (
          <button type="button" onClick={onRetry} className="result-text-link">
            {retryLabel}
          </button>
        )}
        <span className="result-action-separator">·</span>
        <Link href="/" className="result-text-link">
          返回首页
        </Link>
      </div>
    </div>
  );
}
