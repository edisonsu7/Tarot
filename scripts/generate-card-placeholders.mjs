import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cardsPath = path.join(root, "data", "cards.json");
const outDir = path.join(root, "public", "cards");

/** @type {Array<{id:string,nameCn:string,nameEn:string,suit:string,number:number,keywords:string[]}>} */
const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));

fs.mkdirSync(outDir, { recursive: true });

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function suitGlyph(suit) {
  switch (suit) {
    case "wands":
      return "✦";
    case "cups":
      return "☾";
    case "swords":
      return "✶";
    case "pentacles":
      return "⟡";
    default:
      return "✷";
  }
}

function makeSvg(card) {
  const title = esc(card.nameCn);
  const subtitle = esc(card.nameEn);
  const badge = esc(card.suit === "major" ? `Major · ${card.number}` : `${card.suit} · ${card.number}`);
  const glyph = suitGlyph(card.suit);
  const keywords = esc((card.keywords || []).slice(0, 4).join(" · "));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#120a2e"/>
      <stop offset="1" stop-color="#060814"/>
    </linearGradient>
    <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="22%" r="80%">
      <stop offset="0" stop-color="rgba(129,140,248,0.35)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>

  <rect x="36" y="36" width="648" height="1008" rx="44" fill="url(#bg)" stroke="url(#stroke)" stroke-width="10"/>
  <rect x="60" y="60" width="600" height="960" rx="36" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>

  <circle cx="220" cy="240" r="190" fill="url(#glow)"/>
  <circle cx="510" cy="920" r="240" fill="rgba(34,211,238,0.08)" filter="url(#soft)"/>

  <g opacity="0.85">
    <text x="360" y="250" font-family="ui-sans-serif, system-ui, -apple-system" font-size="120" fill="rgba(238,242,255,0.90)" text-anchor="middle">${glyph}</text>
    <path d="M360 320l18 38 42 6-30 28 7 41-37-20-37 20 7-41-30-28 42-6 18-38z" fill="url(#stroke)" opacity="0.55"/>
  </g>

  <g>
    <text x="360" y="690" font-family="ui-sans-serif, system-ui, -apple-system" font-size="56" fill="#eef2ff" text-anchor="middle">${title}</text>
    <text x="360" y="744" font-family="ui-sans-serif, system-ui, -apple-system" font-size="26" fill="rgba(199,210,254,0.85)" text-anchor="middle">${subtitle}</text>
  </g>

  <g>
    <rect x="200" y="790" width="320" height="44" rx="22" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)"/>
    <text x="360" y="820" font-family="ui-sans-serif, system-ui, -apple-system" font-size="18" fill="rgba(238,242,255,0.85)" text-anchor="middle">${badge}</text>
    <text x="360" y="880" font-family="ui-sans-serif, system-ui, -apple-system" font-size="18" fill="rgba(199,210,254,0.75)" text-anchor="middle">${keywords}</text>
  </g>

  <g opacity="0.55">
    <text x="86" y="1010" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" font-size="14" fill="rgba(238,242,255,0.65)">${esc(
      card.id
    )}</text>
  </g>
</svg>`;
}

let written = 0;
for (const card of cards) {
  const out = path.join(outDir, `${card.id}.svg`);
  fs.writeFileSync(out, makeSvg(card), "utf8");
  written += 1;
}

console.log(`Generated ${written} SVG placeholders in ${outDir}`);

