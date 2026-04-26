"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { HOME_SURFACE, bodyTextStyle, homeCardGap, homeCardPadding, homeCardRadius, homeCardShadow, sectionHeadingStyle } from "@/components/homeLayout";

const tileStyle: CSSProperties = {
  display: "grid",
  gap: homeCardGap,
  padding: homeCardPadding,
  borderRadius: homeCardRadius,
  boxShadow: homeCardShadow,
  textDecoration: "none",
  color: "inherit",
  minHeight: 160
};

export function MyPanel() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Link className={`${HOME_SURFACE} cream-tile-link`} href="/history" style={tileStyle}>
        <div style={{ ...sectionHeadingStyle, fontSize: 22 }}>历史记录</div>
        <span style={{ ...bodyTextStyle, margin: 0, fontSize: 15, opacity: 0.8 }}>查看本机保存的抽牌记录</span>
      </Link>
      <Link className={`${HOME_SURFACE} cream-tile-link`} href="/favs" style={tileStyle}>
        <div style={{ ...sectionHeadingStyle, fontSize: 22 }}>收藏牌</div>
        <span style={{ ...bodyTextStyle, margin: 0, fontSize: 15, opacity: 0.8 }}>管理你标记的牌</span>
      </Link>
    </div>
  );
}
