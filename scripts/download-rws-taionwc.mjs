import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public", "cards");

fs.mkdirSync(outDir, { recursive: true });

/** Wikimedia Commons Special:FilePath (redirects to raw file) */
function commonsFileUrl(filename) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadTo(url, outPath) {
  const maxRetries = 8;
  let attempt = 0;
  while (true) {
    const res = await fetch(url, { redirect: "follow" });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      return;
    }

    attempt += 1;
    if (attempt > maxRetries) throw new Error(`HTTP ${res.status} for ${url} (retries exhausted)`);

    // Handle Wikimedia rate limiting gracefully
    const retryAfter = res.headers.get("retry-after");
    const retryAfterMs = retryAfter ? Math.max(0, Number(retryAfter) * 1000) : 0;
    const backoffMs = Math.min(60_000, 1000 * Math.pow(2, attempt - 1));
    const waitMs = Math.max(retryAfterMs, backoffMs);

    process.stdout.write(`HTTP ${res.status}, retry in ${Math.round(waitMs / 1000)}s... `);
    await sleep(waitMs);
  }
}

const majorFilenames = [
  "RWS Tarot 00 Fool.jpg",
  "RWS Tarot 01 Magician.jpg",
  "RWS Tarot 02 High Priestess.jpg",
  "RWS Tarot 03 Empress.jpg",
  "RWS Tarot 04 Emperor.jpg",
  "RWS Tarot 05 Hierophant.jpg",
  "RWS Tarot 06 Lovers.jpg",
  "RWS Tarot 07 Chariot.jpg",
  "RWS Tarot 08 Strength.jpg",
  "RWS Tarot 09 Hermit.jpg",
  "RWS Tarot 10 Wheel of Fortune.jpg",
  "RWS Tarot 11 Justice.jpg",
  "RWS Tarot 12 Hanged Man.jpg",
  "RWS Tarot 13 Death.jpg",
  "RWS Tarot 14 Temperance.jpg",
  "RWS Tarot 15 Devil.jpg",
  "RWS Tarot 16 Tower.jpg",
  "RWS Tarot 17 Star.jpg",
  "RWS Tarot 18 Moon.jpg",
  "RWS Tarot 19 Sun.jpg",
  "RWS Tarot 20 Judgement.jpg",
  "RWS Tarot 21 World.jpg"
];

const majorIds = [
  "the_fool",
  "the_magician",
  "the_high_priestess",
  "the_empress",
  "the_emperor",
  "the_hierophant",
  "the_lovers",
  "the_chariot",
  "strength",
  "the_hermit",
  "wheel_of_fortune",
  "justice",
  "the_hanged_man",
  "death",
  "temperance",
  "the_devil",
  "the_tower",
  "the_star",
  "the_moon",
  "the_sun",
  "judgement",
  "the_world"
];

function minorId(suit, n) {
  // n: 1..14
  if (n === 1) return `${suit}_ace`;
  if (n >= 2 && n <= 10) return `${suit}_${n}`;
  if (n === 11) return `${suit}_page`;
  if (n === 12) return `${suit}_knight`;
  if (n === 13) return `${suit}_queen`;
  if (n === 14) return `${suit}_king`;
  throw new Error(`Unexpected minor number ${n}`);
}

function minorFilename(prefix, n) {
  return `${prefix}${String(n).padStart(2, "0")}.jpg`;
}

const minorSuitDefs = [
  { suit: "cups", prefix: "Cups" },
  { suit: "wands", prefix: "Wands" },
  { suit: "swords", prefix: "Swords" },
  { suit: "pentacles", prefix: "Pents" }
];

const jobs = [];
for (let i = 0; i < majorFilenames.length; i++) {
  jobs.push({ filename: majorFilenames[i], id: majorIds[i] });
}
for (const def of minorSuitDefs) {
  for (let n = 1; n <= 14; n++) {
    jobs.push({ filename: minorFilename(def.prefix, n), id: minorId(def.suit, n) });
  }
}

console.log(`Downloading ${jobs.length} images to ${outDir}`);

let done = 0;
for (const job of jobs) {
  const outPath = path.join(outDir, `${job.id}.jpg`);
  const url = commonsFileUrl(job.filename);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 50_000) {
    done += 1;
    process.stdout.write(`[${String(done).padStart(2, "0")}/${jobs.length}] ${job.id}.jpg exists, skip\n`);
    continue;
  }
  process.stdout.write(`[${String(done + 1).padStart(2, "0")}/${jobs.length}] ${job.filename} -> ${job.id}.jpg ... `);
  await downloadTo(url, outPath);
  done += 1;
  process.stdout.write("ok\n");

  // Small throttle to reduce 429s
  await sleep(250);
}

console.log("Done.");

