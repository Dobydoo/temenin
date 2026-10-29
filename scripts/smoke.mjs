import puppeteer from "puppeteer-core";

const base = "http://localhost:3000";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const log = [];
const step = (name, detail = "") => log.push(`${name}${detail ? `: ${detail}` : ""}`);

await page.goto(`${base}/`, { waitUntil: "networkidle0" });
const sealed = await page.$$eval(".sealed", (els) => els.length);
step("home sealed cards", String(sealed));
const lockedText = await page.$$eval(".locked__value", (els) => els.map((e) => e.textContent?.trim()).slice(0, 3));
step("locked fields", lockedText.join(" | "));

await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle0" });

// verify via safety center
await page.goto(`${base}/safety`, { waitUntil: "networkidle0" });
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")];
  buttons.find((b) => /start id check/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("button")];
  buttons.find((b) => /^continue$/i.test((b.textContent || "").trim()))?.click();
});
await new Promise((r) => setTimeout(r, 400));
step("verification tag", await page.$eval(".tag", (el) => el.textContent?.trim() ?? ""));

await page.goto(`${base}/`, { waitUntil: "networkidle0" });
const unsealed = await page.$$eval(".plan:not(.sealed)", (els) => els.length);
step("unsealed after verify", String(unsealed));

// create activity from a single sentence; the form auto-detects the rest
await page.goto(`${base}/create`, { waitUntil: "networkidle0" });
await page.type("#description", "Sabtu sore mau nonton di Tebet, budget 100 ribuan, pengen teman yang asik diajak ngobrol setelah film.");
await new Promise((r) => setTimeout(r, 300));
const detected = await page.$eval("p.tiny.muted[aria-live]", (el) => el.textContent?.replace(/\s+/g, " ").trim());
step("auto-detected", detected ?? "");

// a board card must lead somewhere: the product's main loop
await page.goto(`${base}/`, { waitUntil: "networkidle0" });
const cardLinks = await page.$$eval(".plan__foot a", (els) => els.map((e) => e.getAttribute("href")));
step("board card links", JSON.stringify(cardLinks));
await page.evaluate(() => {
  [...document.querySelectorAll(".plan__foot a")].find((a) => /see matches/i.test(a.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 900));
step("board card target", page.url());

// poster person detail navigation
await page.goto(`${base}/match/a-sekar-coffee`, { waitUntil: "networkidle0" });
const matchCount = await page.$$eval("article.card, table.table tbody tr", (els) => els.length);
step("matches listed", `${matchCount} (1 lead card + table rows)`);
const firstScore = await page.$eval(".score span", (el) => el.textContent?.trim() ?? "");
step("top score", firstScore);

await page.goto(`${base}/match/a-sekar-coffee/detail?candidate=u-arif`, { waitUntil: "networkidle0" });
const bars = await page.$$eval(".bar", (els) => els.length);
step("score bars", String(bars));
const barsVisible = await page.$$eval(".bar__fill", (els) => els.map((e) => e.style.width));
step("bar widths", barsVisible.join(","));

// pick buddy -> chat
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /ask this buddy/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 900));
step("chat url", page.url());

// message filter
await page.type("#message", "nomor aku 081234567890 ya");
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /^send$/i.test((b.textContent || "").trim()))?.click();
});
await new Promise((r) => setTimeout(r, 400));
const held = await page.$$eval(".bubble--held", (els) => els.length);
const heldNote = await page.$eval(".bubble__note", (el) => el.textContent?.trim() ?? "").catch(() => "");
step("held messages", `${held} ${heldNote}`);

// the safety ticks must survive a reload, or the confirm button silently resets
await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  boxes.forEach((b) => { if (!b.checked) b.click(); });
});
await new Promise((r) => setTimeout(r, 400));
const beforeReload = await page.evaluate(() => {
  const confirm = [...document.querySelectorAll("button")].find((b) => /^confirm meetup$/i.test((b.textContent || "").trim()));
  return { ticked: [...document.querySelectorAll('input[type="checkbox"]')].filter((b) => b.checked).length, enabled: confirm ? !confirm.disabled : false };
});
await page.reload({ waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 400));
const afterReload = await page.evaluate(() => {
  const confirm = [...document.querySelectorAll("button")].find((b) => /^confirm meetup$/i.test((b.textContent || "").trim()));
  return { ticked: [...document.querySelectorAll('input[type="checkbox"]')].filter((b) => b.checked).length, enabled: confirm ? !confirm.disabled : false };
});
step("checklist before reload", JSON.stringify(beforeReload));
step("checklist after reload", JSON.stringify(afterReload));

// confirm meetup
await page.evaluate(() => {
  const boxes = [...document.querySelectorAll('input[type="checkbox"]')];
  boxes.forEach((b) => {
    if (!b.checked) b.click();
  });
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /confirm meetup/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /confirm for the buddy/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 500));
const meetupState = await page.evaluate(() => {
  const tags = [...document.querySelectorAll(".tag")].map((t) => t.textContent?.trim());
  return tags.filter((t) => /confirm/i.test(t ?? "")).join(" | ");
});
step("meetup tags", meetupState);
const venueOpen = await page.evaluate(() => document.body.innerText.includes("Kopi Tuku Tebet"));
step("venue visible after both confirm", String(venueOpen));

// share + complete + checkin
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /share the plan/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 300));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /mark the plan finished/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /home safe/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 400));
const afterCheckin = await page.evaluate(() => document.body.innerText.includes("Check-in recorded"));
step("after finish text", await page.evaluate(() => document.querySelector(".split")?.textContent?.replace(/\s+/g, " ").slice(0, 400) ?? ""));
step("checkin recorded", String(afterCheckin));

// feedback
await page.evaluate(() => {
  [...document.querySelectorAll("a")].find((a) => /give feedback/i.test(a.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 900));
step("feedback url", page.url());
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => /send feedback/i.test(b.textContent || ""))?.click();
});
await new Promise((r) => setTimeout(r, 400));
const feedbackSent = await page.evaluate(() => document.body.innerText.includes("Feedback recorded"));
step("feedback recorded", String(feedbackSent));

// theme + language
await page.goto(`${base}/you`, { waitUntil: "networkidle0" });
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "ID")?.click();
});
await new Promise((r) => setTimeout(r, 400));
const idText = await page.evaluate(() => document.body.innerText.includes("Profilmu"));
step("indonesian switch", String(idText));
await page.evaluate(() => {
  [...document.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Gelap")?.click();
});
await new Promise((r) => setTimeout(r, 400));
const mode = await page.evaluate(() => document.documentElement.dataset.mode ?? "system");
const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
step("dark mode", `${mode} ${bg}`);

// horizontal scroll check at 320 and 1920
for (const width of [320, 375, 768, 1024, 1440, 1920]) {
  await page.setViewport({ width, height: 900 });
  await page.goto(`${base}/`, { waitUntil: "networkidle0" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  step(`overflow ${width}`, String(overflow));
}

console.log(log.join("\n"));
await browser.close();
