"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/daily", label: "今日指引" },
  { href: "/draw", label: "灵感问牌" }
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeHref = useMemo(() => NAV.find((n) => isActivePath(pathname, n.href))?.href ?? "", [pathname]);

  return (
    <header
      className="topnav-shell sticky top-0 z-50 py-3 backdrop-blur"
      data-scrolled={scrolled ? "" : undefined}
    >
      <div className="topnav-bar topnav-bar--wide crystal rune sheen">
        <Link href="/" className="topnav-brand text-base sm:text-lg">
          <span aria-hidden="true" className="topnav-logo" />
          <span aria-hidden="true" className="moon-mark" />
          牌语 Tarot
        </Link>

        <nav aria-label="主导航" className="topnav-primary text-[12px] sm:text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`topnav-link transition ${activeHref === item.href ? "topnav-link--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
