// Renders designs/mockup.html and captures each .frame as a PNG for laya-design scoring.
// Run: NODE_PATH=/Users/ujaye/Downloads/Rex/node_modules node designs/shot.mjs
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, 'run-01', 'pages');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1900, height: 1200 }, deviceScaleFactor: 2 });
await page.goto('file://' + path.join(here, 'mockup.html'));
await page.waitForTimeout(400);

const names = ['01-home', '02-donor-post', '03-match-screen', '04-household', '05-needs-board', '06-impact-receipt'];
const frames = page.locator('.frame');
const n = await frames.count();
for (let i = 0; i < n && i < names.length; i++) {
  await frames.nth(i).screenshot({ path: path.join(outDir, `${names[i]}.png`) });
  console.log('shot:', names[i]);
}
await page.screenshot({ path: path.join(outDir, '00-full-board.png'), fullPage: true });
await browser.close();
console.log('done ->', outDir);
