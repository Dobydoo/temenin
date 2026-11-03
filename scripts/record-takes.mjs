import puppeteer from "puppeteer-core";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import httpModule from "node:http";
import httpsModule from "node:https";

// This Node build bakes a proxy hook into the global agents; null it for local traffic.
for (const agent of [httpModule.globalAgent, httpsModule.globalAgent]) {
  const sym = Object.getOwnPropertySymbols(agent).find((s) => String(s).includes("kProxyConfig"));
  if (sym) agent[sym] = null;
}

process.env.HOME = mkdtempSync(join(tmpdir(), "temenin-take-home-"));
const TAKES = process.env.TAKES_DIR || "/tmp/temenin-takes";
mkdirSync(TAKES, { recursive: true });
const base = "http://127.0.0.1:3000";
const GAP = 0.35; // gaps only between takes; assembler adds lead/tail cards
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const probe = (p) => parseFloat(execFileSync("ffprobe", ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", p], { encoding: "utf8" }).trim());
const audioDur = {};
for (const n of ["s2-sealed", "s3-verify", "s4-create", "s5-matches", "s6-detail", "s7-chat", "s8-close"]) {
  audioDur[n] = probe(`docs/demo/audio/${n}.mp3`);
}
const takeDur = {
  t2: audioDur["s2-sealed"] + GAP, t3: audioDur["s3-verify"] + GAP, t4: audioDur["s4-create"] + GAP,
  t5: audioDur["s5-matches"] + GAP, t6: audioDur["s6-detail"] + GAP, t7: audioDur["s7-chat"] + GAP,
  t8a: (audioDur["s8-close"] + 0.8) * 0.68,
};
console.log("take durations:", Object.fromEntries(Object.entries(takeDur).map(([k, v]) => [k, +v.toFixed(2)])));

// ---- browser + server ----
const server = spawn("npm", ["run", "start", "--", "-p", "3000", "-H", "127.0.0.1"], { stdio: ["ignore", "pipe", "pipe"] });
await sleep(6000);
const browser = await puppeteer.launch({
  browser: "firefox", executablePath: "/usr/bin/firefox", headless: true,
  protocol: "webDriverBiDi", args: ["--no-remote", "--width=1920", "--height=1080"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

// ---- recording state ----
let recording = false, t0 = 0, moves = [], clicks = [], shotTimes = [];
const actualDur = {};
let cursor = { x: 960, y: 900 };
const now = () => (Date.now() - t0) / 1000;

async function pump(dir) {
  let i = 0;
  while (recording) {
    try {
      shotTimes.push(now());
      await page.screenshot({ type: "jpeg", quality: 88, path: `${dir}/f${String(i++).padStart(5, "0")}.jpg` });
    } catch { /* take ended mid-shot */ }
  }
}
async function glide(x, y, dur = 0.45) {
  const steps = Math.max(6, Math.round(dur / 0.03));
  const x0 = cursor.x, y0 = cursor.y;
  for (let i = 1; i <= steps; i++) {
    const e = 1 - (1 - i / steps) ** 2;
    cursor = { x: Math.round(x0 + (x - x0) * e), y: Math.round(y0 + (y - y0) * e) };
    await page.mouse.move(cursor.x, cursor.y);
    moves.push({ t: now(), ...cursor });
    await sleep((dur * 1000) / steps);
  }
  cursor = { x, y };
  moves.push({ t: now(), ...cursor });
}
async function click(x, y) {
  await glide(x, y, 0.4);
  await sleep(120);
  await page.mouse.click(x, y);
  clicks.push({ t: now(), x, y });
  await sleep(250);
}
async function elCenter(tag, source, flags = "") {
  return page.evaluate((t, src, fl) => {
    const rx = new RegExp(src, fl || undefined);
    const els = [...document.querySelectorAll(t)].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && rx.test((e.textContent || "").trim());
    });
    if (!els.length) throw new Error(`missing ${t} /${src}/`);
    const r = els[0].getBoundingClientRect();
    els[0].scrollIntoView({ block: "center" });
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, tag, source, flags);
}
async function clickText(tag, re, flags = "i") {
  await elCenter(tag, re.source, flags);
  await sleep(450); // let scroll settle, then re-resolve
  const q = await page.evaluate((t, src, fl) => {
    const rx = new RegExp(src, fl || undefined);
    const els = [...document.querySelectorAll(t)].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && rx.test((e.textContent || "").trim());
    });
    const r = els[0].getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, tag, re.source, flags);
  await click(q.x, q.y);
}
async function clickSel(sel) {
  await page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) throw new Error(`missing ${s}`);
    e.scrollIntoView({ block: "center" });
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, sel);
  await sleep(450);
  const q = await page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, sel);
  await click(q.x, q.y);
}
async function bottomNav(href) {
  const p = await page.evaluate((h) => {
    const links = [...document.querySelectorAll(`.bottomnav a[href="${h}"]`)];
    if (!links.length) throw new Error(`missing nav ${h}`);
    const r = links[0].getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, href);
  await click(p.x, p.y);
}
async function smoothScrollBy(dy, dur = 2.5) {
  await page.evaluate((amt, ms) => new Promise((done) => {
    const startY = window.scrollY, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms), e = 1 - (1 - p) ** 3;
      window.scrollTo(0, startY + amt * e);
      if (p < 1) requestAnimationFrame(tick);
      else done();
    };
    requestAnimationFrame(tick);
  }), dy, dur * 1000);
}
async function goto(path) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(1200);
}

async function take(name, dur, actions) {
  console.log(`--- ${name} (${dur.toFixed(1)}s) ---`);
  const dir = `${TAKES}/${name}`;
  mkdirSync(dir, { recursive: true });
  moves = []; clicks = []; shotTimes = [];
  // park cursor top-left so the opening frame is clean, then start
  await page.mouse.move(60, 120);
  cursor = { x: 60, y: 120 };
  recording = true;
  t0 = Date.now();
  moves.push({ t: 0, ...cursor });
  const pumpP = pump(dir);
  const start = Date.now();
  await actions();
  const elapsed = (Date.now() - start) / 1000;
  if (elapsed < dur) await sleep((dur - elapsed) * 1000);
  else console.log(`  WARNING: actions overran by ${(elapsed - dur).toFixed(1)}s`);
  recording = false;
  await pumpP;
  const actual = Math.max(elapsed, dur);
  actualDur[name] = +actual.toFixed(2);
  writeFileSync(`${dir}/cursor.json`, JSON.stringify({ planned: dur, actual, moves, clicks, shots: shotTimes.length }));
  console.log(`  ${shotTimes.length} frames, ${moves.length} moves, ${clicks.length} clicks, actual ${actual.toFixed(1)}s`);
}

// ================= takes =================
await take("t2", takeDur.t2, async () => {
  await goto("/");
  await clickText("button", /enter as/i); // Nadia (first account)
  await sleep(1500);
  await bottomNav("/explore");
  await sleep(1200);
  const a = await elCenter("article", /name shows after verification/i);
  await glide(a.x, a.y - 120, 0.8);
  await sleep(900);
  await glide(a.x + 40, a.y + 60, 0.9);
  await sleep(1200);
  await smoothScrollBy(1200, 3.0);
  await sleep(1500);
  await smoothScrollBy(700, 2.2);
  await sleep(1000);
});

await take("t3", takeDur.t3, async () => {
  await clickText("a,button", /verify to unseal/i);
  await sleep(1500);
  await clickText("button", /start id check/i);
  await sleep(1800);
  await clickText("button", /^continue$/i);
  await sleep(2500);
  await bottomNav("/explore");
  await sleep(1200);
  await smoothScrollBy(1100, 2.8);
  await sleep(1200);
});

await take("t4", takeDur.t4, async () => {
  await bottomNav("/create");
  await sleep(1200);
  await clickSel("#description");
  await sleep(300);
  await page.type("#description",
    "Saturday afternoon, want to watch a movie in Tebet, around 100k budget, looking for a buddy who's fun to chat with after the film.",
    { delay: 56 });
  await sleep(2200);
  await smoothScrollBy(900, 2.4);
  await sleep(800);
  // flip Talking level from Bonus to Must meet via keyboard (native select)
  const sel = await page.evaluate(() => {
    const sels = [...document.querySelectorAll("select")];
    const r = sels[0].getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  });
  await click(sel.x, sel.y);
  await sleep(400);
  await page.keyboard.type("M"); // type-ahead jumps to "Must meet"
  await sleep(300);
  await page.keyboard.press("Enter");
  await sleep(1200);
  await smoothScrollBy(-500, 1.8);
  await sleep(800);
});

await take("t5", takeDur.t5, async () => {
  await goto("/match/a-nadia-tebet/detail?candidate=u-arif");
  await sleep(2000);
  await smoothScrollBy(1000, 4.0);
  await sleep(1500);
  await smoothScrollBy(1100, 4.0);
  await sleep(2500);
  const o = await elCenter("h2", /others for this plan/i);
  await glide(o.x - 200, o.y + 40, 0.8);
  await sleep(1200);
});

await take("t6", takeDur.t6, async () => {
  await smoothScrollBy(-1900, 6.5);
  await sleep(2500);
  const b = await elCenter("h2", /why this score/i);
  await glide(b.x + 150, b.y + 120, 0.9);
  await sleep(1500);
  await smoothScrollBy(700, 2.5);
  await sleep(1000);
});

await take("t7", takeDur.t7, async () => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(600);
  await clickText("button", /ask this buddy/i);
  await sleep(1800);
  await clickSel("#message");
  await sleep(300);
  await page.type("#message", "My number is 081234567890, text me there!", { delay: 45 });
  await sleep(400);
  await clickText("button", /^send$/i);
  await sleep(2000);
  for (let i = 0; i < 4; i++) { // all boxes incl. buddy side, or Confirm stays disabled
    const b = await page.evaluate((idx) => {
      const box = [...document.querySelectorAll('input[type="checkbox"]')][idx];
      if (!box) throw new Error("missing checkbox");
      box.scrollIntoView({ block: "center" });
      const r = box.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, i);
    await sleep(350);
    await click(b.x, b.y);
    await sleep(300);
  }
  await clickText("button", /confirm meetup/i);
  await sleep(1200);
  await clickText("button", /confirm for the buddy/i);
  await sleep(1500);
  await clickText("button", /share the plan/i);
  await sleep(1200);
});

await take("t8a", takeDur.t8a, async () => {
  await clickText("button", /mark the plan finished/i);
  await sleep(1200);
  await clickText("button", /i am home safe/i);
  await sleep(1200);
  await clickText("a,button", /give feedback/i);
  await page.waitForFunction(
    () => document.querySelectorAll('div[role="radiogroup"] button').length >= 5,
    { timeout: 12000 });
  await sleep(600);
  // tap 4 then 5 so the rating choice is visible on camera (default is 5)
  for (const idx of [3, 4]) {
    const chip = await page.evaluate((i) => {
      const el = [...document.querySelectorAll('div[role="radiogroup"] button')][i];
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    }, idx);
    await sleep(350);
    await click(chip.x, chip.y);
    await sleep(450);
  }
  await clickText("button", /on time/i);
  await sleep(400);
  await clickSel("textarea");
  await page.type("textarea", "Great film debate, felt safe the whole time.", { delay: 35 });
  await sleep(500);
  await clickText("button", /send feedback/i);
  await sleep(1000);
});

writeFileSync(`${TAKES}/manifest.json`, JSON.stringify({ takeDur, actualDur }, null, 1));
console.log("takes done:", TAKES);
await browser.close();
server.kill("SIGTERM");
process.exit(0);
