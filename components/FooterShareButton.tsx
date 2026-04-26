"use client";

import { useState } from "react";

export function FooterShareButton() {
  const [shared, setShared] = useState(false);

  return (
    <button
      type="button"
      className="site-footer-share"
      onClick={async () => {
        try {
          const url = window.location.href;
          if (navigator.share) {
            await navigator.share({ title: document.title, url });
          } else {
            await navigator.clipboard.writeText(url);
          }
          setShared(true);
          window.setTimeout(() => setShared(false), 1200);
        } catch {}
      }}
      aria-label="分享或复制链接"
      title="分享/复制链接"
    >
      {shared ? "已复制" : "分享"}
    </button>
  );
}

