import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { MouseGlow } from "@/components/MouseGlow";

export const metadata: Metadata = {
  title: {
    default: "牌语 Tarot",
    template: "%s｜牌语 Tarot"
  },
  description: "每天一张塔罗牌，今日指引。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "牌语 Tarot",
    description: "每天一张塔罗牌，今日指引。",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="theme-cream" data-theme="moon" suppressHydrationWarning>
      <body className="min-h-dvh subpixel-antialiased">
        <MouseGlow />
        <div className="site-shell relative isolate flex min-h-dvh w-full flex-col px-3 pb-12 pt-0 sm:px-5 md:px-6">
          <TopNav />
          <main className="page-main relative z-0 min-w-0 flex-1">{children}</main>
          <footer className="site-footer">
            <div className="site-footer-inner">
              <p className="site-footer-lead">
                <Link href="/privacy" className="site-footer-privacy-link">隐私与数据</Link>
                {" · "}© 2026 牌语 Tarot
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
