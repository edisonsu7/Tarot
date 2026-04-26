import type { CSSProperties, ReactNode } from "react";

/** 与首页 `HomeLanding` 大卡同源：奶油面板 + 轻装饰（全站 theme-cream） */
export const HOME_SURFACE = "home-cream-panel crystal rune sheen";

export const homeCardShadow =
  "0 1px 0 rgba(255,255,255,0.65) inset, 0 22px 56px -40px rgba(60,45,30,0.14)";

export const homeOuterStyle: CSSProperties = {
  maxWidth: "min(100%, var(--site-content-max))",
  margin: "0 auto",
  display: "grid",
  gap: 24
};

export const homeInnerStyle: CSSProperties = {
  maxWidth: "min(100%, var(--site-content-max))",
  margin: "0 auto",
  width: "100%",
  display: "grid",
  gap: 24
};

export const homeCardPadding = 28;
export const homeCardRadius = 26;
export const homeCardGap = 14;

export const siteTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: -0.1,
  lineHeight: 1.2,
  color: "var(--cream-ink)"
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: -0.08,
  lineHeight: 1.25,
  color: "var(--cream-ink)"
};

export const pageDescStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 15,
  lineHeight: 1.65,
  color: "var(--cream-muted)",
  maxWidth: "42ch"
};

export const bodyTextStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.65,
  color: "var(--cream-muted)"
};

export const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.35,
  color: "var(--cream-ink)"
};

/* 全站统一字体：不再提供 sans 变体 */
export const sectionHeadingSansStyle: CSSProperties = sectionHeadingStyle;
export const pageTitleSansStyle: CSSProperties = pageTitleStyle;
export const pageDescSansStyle: CSSProperties = pageDescStyle;
export const bodyTextSansStyle: CSSProperties = bodyTextStyle;

export const ghostLinkStyle: CSSProperties = {
  borderRadius: 18,
  border: "1px solid var(--cream-line)",
  background: "rgba(255,255,255,0.42)",
  padding: "12px 18px",
  color: "var(--cream-ink)",
  textDecoration: "none",
  fontSize: 15,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center"
};

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div style={homeOuterStyle}>
      <div style={homeInnerStyle}>{children}</div>
    </div>
  );
}

export function PageIntro({
  title,
  description,
  typography = "default"
}: {
  title: string;
  description: string;
  typography?: "default" | "panelSans";
}) {
  const titleStyle = typography === "panelSans" ? pageTitleSansStyle : pageTitleStyle;
  const descStyle = typography === "panelSans" ? pageDescSansStyle : pageDescStyle;
  return (
    <header className={HOME_SURFACE}>
      <h1 style={titleStyle}>{title}</h1>
      <p style={descStyle}>{description}</p>
    </header>
  );
}

export function PageIntroRow({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <header className={HOME_SURFACE}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div style={{ minWidth: 0 }}>
          <h1 style={pageTitleStyle}>{title}</h1>
          <p style={pageDescStyle}>{description}</p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">{action}</div>
      </div>
    </header>
  );
}

export function PageSection({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section
      id={id}
      className={`${HOME_SURFACE} ${className}`.trim()}
      style={{
        display: "grid",
        gap: homeCardGap
      }}
    >
      {children}
    </section>
  );
}
