import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-lead">
          <Link href="/privacy" className="site-footer-privacy-link">隐私与数据</Link>
          {" · "}© 2026 牌语 Tarot
        </p>
      </div>
    </footer>
  );
}
