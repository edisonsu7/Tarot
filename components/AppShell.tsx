"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";

const NO_FOOTER_PATHS = [
  "/daily",      // DailyDrawPick 7-card fan (immersive, full-height)
  "/ask/draw",   // AskDrawPick 7-card fan (immersive, full-height)
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const showFooter = !NO_FOOTER_PATHS.includes(pathname);

  return (
    <div className="site-shell relative isolate flex min-h-dvh w-full flex-col px-3 pt-0 sm:px-5 md:px-6">
      <TopNav />
      <main className="page-main relative z-0 min-w-0 flex-1">
        {children}
      </main>
      {showFooter && <SiteFooter />}
    </div>
  );
}
