import puppeteer from "puppeteer-core";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import http from "node:http";

// This Node build bakes a proxy hook into the global http/https agents
// (kProxyConfig, empty bypass list); the sandbox proxy cannot reach
// sandbox-localhost, so null the hook config: all traffic here is local.
// Verified: http.get returns 200 only after this (puppeteer's CDP socket
// uses the same global agent).
import httpModule from "node:http";
import httpsModule from "node:https";
for (const agent of [httpModule.globalAgent, httpsModule.globalAgent]) {
  const sym = Object.getOwnPropertySymbols(agent).find((s) => String(s).includes("kProxyConfig"));
  if (sym) agent[sym] = null;
}

const base = "http://127.0.0.1:3000";

// Boot the server as a child process (sandbox forbids shell backgrounding).
// PROD=1 serves the production build (no dev "N" badge in shots).
const prod = process.env.PROD === "1";
const server = spawn(
  "npm",
  prod
    ? ["run", "start", "--", "-p", "3000", "-H", "127.0.0.1"]
    : ["run", "dev", "--", "--port", "3000", "--hostname", "127.0.0.1"],
  { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, BROWSER: "none" } }
);
const waitForServer = async () => {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const req = http.get(`${base}/`, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.setTimeout(3000, () => { req.destroy(); resolve(false); });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("dev server never came up");
};
await waitForServer();
console.log("dev server up");
const shots = "docs/demo/shots";
mkdirSync(shots, { recursive: true });

// Firefox instead of Chrome: the sandbox blocks socket(AF_UNIX), which Chrome's
// process singleton needs (FATAL), while Firefox headless runs fine here.
process.env.HOME = mkdtempSync(join(tmpdir(), "temenin-demo-home-"));
process.env.XDG_CONFIG_HOME = join(process.env.HOME, ".config");
const browser = await puppeteer.launch({
  browser: "firefox",
  executablePath: "/usr/bin/firefox",
  headless: true,
  protocol: "webDriverBiDi",
  args: ["--no-remote", "--width=1920", "--height=1080"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (name) => page.screenshot({ path: `${shots}/${name}.png` });
const clickText = async (tag, re) => {
  await page.evaluate((t, source) => {
    const rx = new RegExp(source, "i");
    const el = [...document.querySelectorAll(t)].find((e) => rx.test((e.textContent || "").trim()));
    if (!el) throw new Error(`missing ${t} /${source}/`);
    el.scrollIntoView({ block: "center" });
    el.click();
  }, tag, re.source);
};
const gotoClean = async (path) => {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle0", timeout: 60000 });
  await sleep(700);
  // Opaque sticky header: content sliding under it looks intentional, not broken.
  await page.evaluate(() => {
    document.querySelectorAll("header").forEach((h) => {
      h.style.background = "#FFF6DC";
      h.style.boxShadow = "0 2px 12px rgba(66,91,154,.12)";
    });
  });
};

// 1. Gate + sealed board as Nadia (unverified)
await page.evaluate(() => localStorage.clear()).catch(() => {});
await gotoClean("/");
await shot("s0-gate");
await clickText("button", /enter as/i);
await sleep(900);
await gotoClean("/explore");
await page.evaluate(() => {
  ([...document.querySelectorAll(".sealed")][3] ?? document.querySelector("main"))?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -130);
});
await sleep(400);
await shot("s2-sealed");

// 2. Verify via Safety Center
await gotoClean("/safety");
await clickText("button", /start id check/i);
await sleep(600);
await clickText("button", /^continue$/i);
await sleep(800);
await shot("s3a-safety");

// 3. Same board, now open
await gotoClean("/explore");
await page.evaluate(() => {
  ([...document.querySelectorAll(".plan:not(.sealed)")][3] ?? document.querySelector("main"))?.scrollIntoView({ block: "start" });
  window.scrollBy(0, -130);
});
await sleep(400);
await shot("s3b-board-open");

// 4. Create: type one sentence, draft appears
await gotoClean("/create");
await page.type(
  "#description",
  "Saturday afternoon, want to watch a movie in Tebet, around 100k budget, looking for a buddy who's fun to chat with after the film.",
  { delay: 12 }
);
await sleep(1400);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(300);
await shot("s4a-create");
await page.evaluate(() => {
  const el = document.querySelector("p.tiny.muted[aria-live]") ?? document.querySelector("main");
  el?.scrollIntoView({ block: "center" });
});
await sleep(300);
await shot("s4b-detected");

// 5+6. Match detail: score bars, openers/venues, then the ranked "Others" list
await gotoClean("/match/a-nadia-tebet/detail?candidate=u-arif");
await shot("s6a-detail");
await page.evaluate(() => window.scrollBy(0, 900));
await sleep(400);
await shot("s6b-detail-more");
await page.evaluate(() => {
  const heads = [...document.querySelectorAll("h2")];
  heads.find((h) => /others for this plan/i.test(h.textContent || ""))?.scrollIntoView({ block: "center" });
});
await sleep(400);
await shot("s5-matches");

// 7. Chat: held message, then two-sided confirm
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(300);
await clickText("button", /ask this buddy/i);
await sleep(1200);
await page.type("#message", "My number is 081234567890, text me there!", { delay: 10 });
await sleep(300);
await clickText("button", /^send$/i);
await sleep(800);
await shot("s7a-held");
await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  boxes.forEach((b) => { if (!b.checked) b.click(); });
});
await sleep(500);
await clickText("button", /confirm meetup/i);
await sleep(600);
await clickText("button", /confirm for the buddy/i);
await sleep(900);
await page.evaluate(() => {
  const el = [...document.querySelectorAll(".tag")].find((t) => /confirm/i.test(t.textContent || ""));
  el?.scrollIntoView({ block: "center" });
});
await sleep(300);
await shot("s7b-confirmed");

// 8. Feedback (share + finish + check in first, then the link appears)
await clickText("button", /share the plan/i);
await sleep(500);
await clickText("button", /mark the plan finished/i);
await sleep(600);
await clickText("button", /i am home safe/i);
await sleep(800);
await clickText("a,button", /give feedback/i);
await sleep(1200);
await page.evaluate(() => {
  const stars = [...document.querySelectorAll("button")].filter((b) => /star/i.test(b.getAttribute("aria-label") || ""));
  (stars[4] ?? stars[stars.length - 1])?.click();
});
await sleep(300);
await clickText("button", /on time/i);
await sleep(200);
await page.type("textarea", "Great film debate, felt safe the whole time.", { delay: 8 });
await sleep(400);
await shot("s8-feedback");

console.log("shots done");
await browser.close();
server.kill("SIGTERM");
