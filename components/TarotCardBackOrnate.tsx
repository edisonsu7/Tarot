"use client";

/**
 * 对称牌背（看不出正逆位）：双线框、角饰、中心交织纹样与细线装饰。
 * 用于选牌页等比缩放。
 */
export function TarotCardBackOrnate({ width, height }: { width: number; height: number }) {
  const stroke = "#9a7348";
  const strokeSoft = "rgba(154, 115, 72, 0.35)";
  const fill = "#f7f0e6";
  const fillDeep = "#efe6d8";
  const accent = "#b88a3d";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", borderRadius: "inherit" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="tcb-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4b896" stopOpacity="0.9" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7d5c32" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="tcb-vignette" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor={fillDeep} stopOpacity="1" />
        </radialGradient>
      </defs>

      <rect x="1" y="1" width="198" height="298" rx="14" fill="url(#tcb-vignette)" stroke={strokeSoft} strokeWidth="1" />

      <rect x="6" y="6" width="188" height="288" rx="11" stroke={stroke} strokeWidth="0.75" opacity="0.55" />
      <rect x="9" y="9" width="182" height="282" rx="9" stroke="url(#tcb-gold)" strokeWidth="0.9" opacity="0.75" />

      {/* corner flourishes */}
      <g stroke={accent} strokeWidth="0.65" fill="none" opacity="0.85">
        <path d="M18 22 C28 18,32 18,34 28 M34 22 C30 14,22 12,16 16" />
        <path transform="scale(-1,1) translate(-200,0)" d="M18 22 C28 18,32 18,34 28 M34 22 C30 14,22 12,16 16" />
        <path transform="translate(0,300) scale(1,-1)" d="M18 22 C28 18,32 18,34 28 M34 22 C30 14,22 12,16 16" />
        <path transform="translate(200,300) scale(-1,-1)" d="M18 22 C28 18,32 18,34 28 M34 22 C30 14,22 12,16 16" />
      </g>

      {/* subtle side filigree */}
      <g stroke={stroke} strokeWidth="0.4" opacity="0.4">
        <path d="M14 120 Q10 150 14 180" />
        <path d="M186 120 Q190 150 186 180" />
      </g>

      {/* outer ring + ticks — symmetric */}
      <g transform="translate(100,148)" stroke={accent} strokeWidth="0.5" opacity="0.65">
        <circle r="58" fill="none" />
        <circle r="52" fill="none" stroke={strokeSoft} strokeWidth="0.35" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 24;
          const r0 = i % 2 === 0 ? 50 : 51;
          const r1 = 56;
          const x0 = Math.sin(a) * r0;
          const y0 = -Math.cos(a) * r0;
          const x1 = Math.sin(a) * r1;
          const y1 = -Math.cos(a) * r1;
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} />;
        })}
      </g>

      {/* dot ring */}
      <g fill={accent} opacity="0.5">
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 16 + 0.12;
          const r = 68;
          const x = 100 + Math.sin(a) * r;
          const y = 148 - Math.cos(a) * r;
          return <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} />;
        })}
      </g>

      {/* central interlaced X + 罗盘感四向刻度 — 对称 */}
      <g transform="translate(100,148)" stroke="url(#tcb-gold)" strokeWidth="1.1" fill="none" opacity="0.88">
        <path d="M-22 -22 L22 22 M22 -22 L-22 22" strokeLinecap="round" />
        <path d="M-14 -14 L14 14 M14 -14 L-14 14" strokeWidth="0.55" opacity="0.7" strokeLinecap="round" />
        <rect x="-10" y="-10" width="20" height="20" transform="rotate(45)" strokeWidth="0.6" opacity="0.65" />
        <circle r="6" strokeWidth="0.7" />
        <g stroke={accent} strokeWidth="0.45" opacity="0.55">
          <line x1="0" y1="-15" x2="0" y2="-10" strokeLinecap="round" />
          <line x1="0" y1="10" x2="0" y2="15" strokeLinecap="round" />
          <line x1="-15" y1="0" x2="-10" y2="0" strokeLinecap="round" />
          <line x1="10" y1="0" x2="15" y2="0" strokeLinecap="round" />
        </g>
        <circle r="3" fill={accent} fillOpacity="0.25" stroke="none" />
      </g>

      {/* micro sunburst */}
      <g transform="translate(100,148)" stroke={stroke} strokeWidth="0.35" opacity="0.35">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x2 = Math.sin(a) * 26;
          const y2 = -Math.cos(a) * 26;
          return <line key={i} x1="0" y1="0" x2={x2} y2={y2} />;
        })}
      </g>

      <text
        x="100"
        y="268"
        textAnchor="middle"
        fill={accent}
        fillOpacity="0.35"
        fontSize="8"
        fontWeight="600"
        letterSpacing="0.28em"
        style={{ fontFamily: "ui-serif, Georgia, serif" }}
      >
        MYSTIC
      </text>
    </svg>
  );
}
