// Clicks through the real app end-to-end and screenshots every screen.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'designs', 'run-01', 'app');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 400, height: 820 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('http://localhost:8123/#home');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outDir, 'app-01-home.png') });

// donate flow
await page.goto('http://localhost:8123/#donate');
await page.waitForTimeout(300);
await page.fill('#postText', '40 vegetarian prepared meals, refrigerated, need gone by 7pm');
await page.waitForTimeout(250);
await page.check('#attest');
const findBtn = page.locator('#findMatch');
if (await findBtn.isDisabled()) { errors.push('find button did not enable'); }
await page.screenshot({ path: path.join(outDir, 'app-02-post.png') });
await page.click('#findMatch');
await page.waitForTimeout(700); // parse + render match
await page.screenshot({ path: path.join(outDir, 'app-03-match.png'), fullPage: true });

// connect -> receipt
const connect = page.locator('[data-connect]');
if (await connect.count() === 0) errors.push('no connect button');
else {
  await connect.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'app-04-receipt.png'), fullPage: true });
}

// household view + spanish + sms
await page.goto('http://localhost:8123/#need');
await page.waitForTimeout(300);
await page.click('[data-lang="es"]');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'app-05-household-es.png'), fullPage: true });
await page.goto('http://localhost:8123/#sms');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'app-06-sms-es.png'), fullPage: true });
await page.goto('http://localhost:8123/#need');
await page.waitForTimeout(200);
await page.click('[data-lang="en"]');
await page.waitForTimeout(200);

// needs board + post a need
await page.goto('http://localhost:8123/#needs-board');
await page.waitForTimeout(300);
await page.fill('#needText', 'We need 30 halal meals Friday night');
await page.click('#postNeed');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'app-07-needs-board.png'), fullPage: true });

// home again (impact should show 40 meals)
await page.goto('http://localhost:8123/#home');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'app-08-home-after.png'), fullPage: true });

await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no JS errors — flow complete');
