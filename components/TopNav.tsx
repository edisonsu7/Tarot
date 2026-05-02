"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="topnav-shell sticky top-0 z-50 py-3"
      data-scrolled={scrolled ? "" : undefined}
    >
      <div className="topnav-bar topnav-bar--wide crystal rune sheen">
        <Link href="/" className="topnav-brand topnav-brand--logo text-base sm:text-lg">
          <span aria-hidden="true" className="topnav-logo" />
          <span aria-hidden="true" className="moon-mark" />
          牌语 Tarot
        </Link>

        <nav aria-label="主导航" className="topnav-primary text-[12px] sm:text-sm">
          <Link href="/about" className="topnav-link transition">关于</Link>
        </nav>
      </div>
    </header>
  );
}
