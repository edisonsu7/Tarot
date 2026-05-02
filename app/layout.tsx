import type { Metadata } from "next";
import "./globals.css";
import { MouseGlow } from "@/components/MouseGlow";
import { AppShell } from "@/components/AppShell";

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
