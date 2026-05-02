"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDateKeyInTimeZone } from "@/lib/dateKey";
import { getDrawForDate } from "@/lib/drawStorage";

export function HomeLanding() {
  const [hasDailyToday, setHasDailyToday] = useState(false);

  useEffect(() => {
    try {
      const today = getDateKeyInTimeZone(new Date(), "Asia/Shanghai");
      const record = getDrawForDate(today);
      setHasDailyToday(!!record);
    } catch {}
  }, []);

  return (
    <div className="w-full">
      <div className="home-cream-panel">
        <header className="home-cream-head text-center" style={{ paddingTop: 4 }}>
          <p className="home-cream-lead">今天，你想知道什么？</p>
        </header>

        <div className="home-cream-dual">
          <Link href="/daily" className="home-cream-card home-cream-card--tilt-l">
            <h2>今日指引</h2>
            {hasDailyToday ? (
              <>
                <p>你今天已经抽过牌了。</p>
                <span className="home-cream-cta">查看今日结果 →</span>
              </>
            ) : (
              <>
                <p>每天一张牌，看看今天适合关注什么。</p>
                <span className="home-cream-cta">开始今日指引 →</span>
              </>
            )}
          </Link>
          <Link href="/ask" className="home-cream-card home-cream-card--tilt-r">
            <h2>灵感问牌</h2>
            <p>写下你心中的问题，抽一张牌，获得一个方向性提示。</p>
            <span className="home-cream-cta">开始问牌 →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
