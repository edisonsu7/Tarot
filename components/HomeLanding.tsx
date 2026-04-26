"use client";

import Link from "next/link";

/** 首页：奶油双卡片风，样式见 `app/globals.css`（与全站 theme-cream 一致）。 */
export function HomeLanding() {
  return (
    <div className="w-full">
      <div className="home-cream-panel">
        <header className="home-cream-head text-center" style={{ paddingTop: 4 }}>
          <p className="home-cream-lead">今天想要一个提醒，还是想问一个答案？</p>
        </header>

        <div className="home-cream-dual">
          <Link href="/daily" className="home-cream-card home-cream-card--tilt-l">
            <span className="home-cream-deco" aria-hidden="true">
              ☀
            </span>
            <h2>今日指引</h2>
            <p>每天一张牌，看看今天适合关注什么。</p>
            <span className="home-cream-cta">开始今日指引 →</span>
          </Link>

          <Link href="/draw" className="home-cream-card home-cream-card--tilt-r">
            <span className="home-cream-deco" aria-hidden="true" style={{ fontSize: 36 }}>
              ✧
            </span>
            <span className="home-cream-stack" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <h2>灵感问牌</h2>
            <p>写下你的问题，让牌给你一个方向性的提示。</p>
            <span className="home-cream-cta">开始灵感问牌 →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
