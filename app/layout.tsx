import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { MouseGlow } from "@/components/MouseGlow";
// footer links simplified per product spec

export const metadata: Metadata = {
  title: {
    default: "牌语 Tarot",
    template: "%s｜牌语 Tarot"
  },
  description: "今日指引与灵感问牌。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "牌语 Tarot",
    description: "今日指引与灵感问牌。",
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
              {/* 页脚也只保留一个主 card 入口 */}
              <nav className="site-footer-nav" aria-label="页脚链接">
                <Link
                  href="/privacy"
                  className="home-cream-panel crystal rune sheen"
                  style={{
                    textDecoration: "none",
                    display: "inline-block",
                    width: "min(100%, 520px)",
                    padding: "14px 16px",
                    minHeight: "auto"
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--cream-ink)", lineHeight: 1.35 }}>隐私与数据</div>
                  <div style={{ fontSize: 13, color: "var(--cream-muted)", marginTop: 6, lineHeight: 1.6 }}>抽牌规则、数据存储与免责声明</div>
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
