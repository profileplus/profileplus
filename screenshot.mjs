import path from "node:path";
import fs from "node:fs";
import url from "node:url";

const { default: puppeteer } = await import("puppeteer");

const target = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] ? `-${process.argv[3]}` : "";
const mode = process.argv[4] || "full"; // "full" or "viewport" or a Y-scroll value
const scrollY = /^\d+$/.test(mode) ? parseInt(mode, 10) : null;

const ROOT = path.dirname(url.fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, "temporary screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

let n = 1;
while (fs.existsSync(path.join(OUT_DIR, `screenshot-${n}${label}.png`))) n++;
const outPath = path.join(OUT_DIR, `screenshot-${n}${label}.png`);

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(target, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise(r => setTimeout(r, 700));

if (scrollY !== null) {
  await page.evaluate(y => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: y, behavior: 'instant' });
  }, scrollY);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: outPath, fullPage: false });
} else if (mode === "viewport") {
  await page.screenshot({ path: outPath, fullPage: false });
} else {
  await page.screenshot({ path: outPath, fullPage: true });
}

await browser.close();
console.log(outPath);
