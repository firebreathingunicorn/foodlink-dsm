// Clicks through the site end-to-end at laptop and phone widths and screenshots it.
// Needs: cd app && python3 -m http.server 8123
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'designs', 'run-03');
fs.mkdirSync(outDir, { recursive: true });
const errors = [];
const browser = await chromium.launch({ headless: true });

for (const [name, viewport] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  page.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(name + ' console: ' + m.text()); });
  await page.goto('http://localhost:8123/');
  await page.waitForTimeout(2500);
  if (await page.locator('#photoPrev').isVisible()) errors.push(name + ': empty photo box is showing before a photo is chosen');
  if (await page.locator('#directory .card').count() < 6) errors.push(name + ': pantry list missing');
  if (await page.locator('#directory a[href^="tel:"]').count() < 6) errors.push(name + ': call links missing');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) errors.push(name + ': page scrolls sideways');
  await page.screenshot({ path: path.join(outDir, name + '-1-top.png') });
  await page.screenshot({ path: path.join(outDir, name + '-2-full.png'), fullPage: true });

  await page.click('#useExample');
  if (await page.locator('.parsed .chip').count() < 4) errors.push(name + ': note was not understood');
  await page.setInputFiles('#photo', path.join(here, '..', 'designs', 'run-03', 'desktop-1-top.png'));
  await page.waitForTimeout(500);
  await page.check('#attest');
  await page.click('#findMatch');
  await page.waitForTimeout(700);
  if (await page.locator('.match').count() < 3) errors.push(name + ': no matches');
  if (await page.locator('.asked').count() < 1) errors.push(name + ': match does not show the pantry request');
  if (await page.locator('.gated').count() < 1) errors.push(name + ': no ruled-out list');
  await page.locator('#give').screenshot({ path: path.join(outDir, name + '-3-match.png') });
  const before = await page.locator('#listings .card').count();
  await page.click('#connect');
  await page.waitForTimeout(300);
  if (await page.locator('.receipt').count() !== 1) errors.push(name + ': no receipt');
  if (await page.locator('#listings .card').count() !== before + 1) errors.push(name + ': donation did not reach the board');
  if (await page.locator('#listings .cardphoto').count() !== 1) errors.push(name + ': photo missing from the posting');
  await page.locator('#give').screenshot({ path: path.join(outDir, name + '-4-receipt.png') });
  if (await page.locator('.asked').count() !== 0 || await page.locator('.prog').count() !== 1) errors.push(name + ': donation did not count toward the pantry request');
  if (await page.locator('#map .leaflet-interactive').count() < 6) errors.push(name + ': map has no pantries');
  await page.locator('#find').screenshot({ path: path.join(outDir, name + '-5-find.png') });

  if (await page.locator('#jobList .card').count() !== 4) errors.push(name + ': donation did not create a driving job');
  await page.locator('#jobList [data-job]').first().click();
  if (await page.locator('#jobList .card').first().locator('.src').innerText() !== '1 of 1 person') errors.push(name + ': could not take a job');
  await page.fill('#jobText', 'Two people to unload a truck Friday 3 PM');
  await page.click('#postJob');
  if (await page.locator('#jobList .card').count() !== 5) errors.push(name + ': job was not posted');
  await page.locator('#time').screenshot({ path: path.join(outDir, name + '-6-time.png') });
  const nb = await page.locator('#needList .card').count();
  await page.fill('#needText', 'We need 30 halal meals Friday night');
  await page.click('#postNeed');
  await page.waitForTimeout(200);
  if (await page.locator('#needList .card').count() !== nb + 1) errors.push(name + ': need was not posted');
  await page.close();
}
await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors — flow complete');
