// Clicks through the real app end-to-end and screenshots every screen.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'designs', 'run-02', 'app');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 400, height: 820 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('http://localhost:8123/#home');
await page.waitForTimeout(500);

// first-run welcome overlay → take the tour
const welcome = page.locator('#welcome');
if (await welcome.count() === 0) errors.push('welcome overlay missing on first run');
await page.screenshot({ path: path.join(outDir, 'app-00-welcome.png') });
await page.click('[data-w="tour"]');
await page.waitForTimeout(400);
for (let s = 0; s < 7; s++) {
  const next = page.locator('[data-tour="next"]');
  if (await next.count() === 0) { errors.push('tour bar missing at step ' + s); break; }
  if (s === 1) await page.screenshot({ path: path.join(outDir, 'app-00b-tour-donate.png') });
  if (s === 2) { // match step: connect button must exist via ensureDraft
    if (await page.locator('[data-connect]').count() === 0) errors.push('tour: no connect button at match step');
    await page.screenshot({ path: path.join(outDir, 'app-00c-tour-match.png') });
  }
  await next.click();
  await page.waitForTimeout(450);
}
const tourGone = await page.locator('.tourbar').count();
if (tourGone > 0) errors.push('tour did not finish');
await page.screenshot({ path: path.join(outDir, 'app-01-home.png') });

// settings drawer (AI provider)
await page.goto('http://localhost:8123/#settings');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'app-02-settings.png'), fullPage: true });

// donate flow (async parse: wait for the debounced preview) + direct-to-household option
await page.goto('http://localhost:8123/#donate');
await page.waitForTimeout(300);
await page.fill('#postText', '40 vegetarian prepared meals, refrigerated, need gone by 7pm');
await page.waitForTimeout(800); // debounce 350ms + parse
const parsed = await page.locator('.parsed').count();
if (!parsed) errors.push('parse preview did not render');
await page.check('#attest');
await page.check('#directOffer');
await page.screenshot({ path: path.join(outDir, 'app-03-post.png') });
await page.click('#findMatch');
await page.waitForTimeout(700);
const fdia = await page.locator('.fdia-badge').count();
if (!fdia) errors.push('direct-to-household candidate missing');
await page.screenshot({ path: path.join(outDir, 'app-04-match.png'), fullPage: true });

// connect -> receipt
const connect = page.locator('[data-connect]');
if (await connect.count() === 0) errors.push('no connect button');
else {
  await connect.first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'app-05-receipt.png'), fullPage: true });
}

// find food (richer view)
await page.goto('http://localhost:8123/#need');
await page.waitForTimeout(300);
await page.fill('#searchFood', 'vegetarian');
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(outDir, 'app-06-need-search.png'), fullPage: true });
await page.fill('#searchFood', '');
await page.waitForTimeout(400);
await page.click('[data-lang="es"]');
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'app-07-need-es.png'), fullPage: true });

// AI assistant chat (offline canned fallback in headless test)
await page.goto('http://localhost:8123/#sms');
await page.waitForTimeout(300);
await page.fill('#chatInput', 'necesito comida para 4 personas hoy');
await page.click('#chatSend');
await page.waitForTimeout(900); // canned fallback path
const replyCount = await page.locator('.sms').count();
if (replyCount < 2) errors.push('chat did not produce a reply');
await page.screenshot({ path: path.join(outDir, 'app-08-chat.png'), fullPage: true });

// needs board + network pulse + data export + prompt transparency
await page.goto('http://localhost:8123/#needs-board');
await page.waitForTimeout(300);
const pulse = await page.locator('#exportData').count();
if (!pulse) errors.push('network pulse / export missing');
await page.fill('#needText', 'We need 30 halal meals Friday night');
await page.click('#postNeed');
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(outDir, 'app-09-needs-board.png'), fullPage: true });

await page.goto('http://localhost:8123/#how');
await page.waitForTimeout(300);
const promptbox = await page.locator('.promptbox').count();
if (promptbox < 2) errors.push('prompt transparency view missing');
await page.screenshot({ path: path.join(outDir, 'app-10-how.png'), fullPage: true });

await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no JS errors — flow complete');
