import { chromium } from 'playwright';
import fs from 'node:fs';
const svg = fs.readFileSync('app/icon.svg', 'utf8');
const b = await chromium.launch(); 
let p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
await p.setContent(`<body style="margin:0;background:transparent">${svg.replace('<svg ', '<svg width="1024" height="1024" ')}</body>`);
await p.screenshot({ path: 'designs/xenia-logo.png', omitBackground: true });
p = await b.newPage({ viewport: { width: 1500, height: 1000 } });
await p.setContent(`<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet">
<body style="margin:0;height:100vh;background:#f6f2e8;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Fraunces,Georgia,serif;color:#16201a">
<div style="display:flex;align-items:center;gap:40px">${svg.replace("<svg ", "<svg width=\"230\" height=\"230\" ")}<div style="font-size:230px;font-weight:700;letter-spacing:-.03em;line-height:1">Xenia</div></div>
<div style="font:500 44px -apple-system,sans-serif;color:#3c463e;margin-top:56px">Extra food, to the people who need it.</div>
<div style="font:700 24px -apple-system,sans-serif;letter-spacing:.14em;color:#12613a;margin-top:26px">GREATER DES MOINES</div></body>`);
await p.waitForTimeout(1500);
await p.screenshot({ path: 'designs/xenia-devpost-thumbnail.png' });
await b.close();
