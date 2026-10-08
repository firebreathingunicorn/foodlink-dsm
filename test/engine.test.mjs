/* FoodLink engine self-tests — run: node test/engine.test.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../app/js/engine.js');
const D = require('../app/js/data.js');
const AI = require('../app/js/ai.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, detail !== undefined ? '→ got ' + JSON.stringify(detail) : ''); }
}
function near(a, b, tol) { return Math.abs(a - b) <= (tol || 0.001); }

console.log('— worked example (PLAN-v2 §7) —');
const donation = { type: 'prepared', qty: 40, diet: 'vegetarian', storage: 'refrigerated',
  deadlineMin: 150, attested: true, deadlineLabel: 'by 7:00 PM' };
const ranked = E.rank(D.orgs, donation);
const byId = {};
ranked.forEach(r => { if (!r.gated) byId[r.org.id] = r; });

ok('4 orgs pass gates, 4 gated', ranked.filter(r => !r.gated).length === 4 && ranked.filter(r => r.gated).length === 4);
ok('DMARC partner scores 82.4%', near(byId['dmarc-partner'].score, 0.8244, 0.002), byId['dmarc-partner'] && byId['dmarc-partner'].score);
ok('Hope shelter scores 62.1%', near(byId['hope-shelter'].score, 0.6210, 0.002), byId['hope-shelter'] && byId['hope-shelter'].score);
ok('Church kitchen scores 55.0%', near(byId['urbandale-church'].score, 0.5504, 0.002), byId['urbandale-church'] && byId['urbandale-church'].score);
ok('Produce pantry gated on food type', ranked.find(r => r.gated && r.org.id === 'polk-produce').reasons[0].includes('cannot accept'));
ok('Ranking: DMARC first', ranked[0].org.id === 'dmarc-partner');
ok('weights sum to 1', near(E.WEIGHTS.urgency + E.WEIGHTS.distance + E.WEIGHTS.capacity + E.WEIGHTS.transport, 1));

console.log('— robustness (Monte Carlo) —');
const A = byId['dmarc-partner'].factors, B = byId['urbandale-church'].factors, Dv = byId['hope-shelter'].factors;
ok('A dominates B on every factor → P=1.0', E.dominates(A, B) && E.monteCarlo(A, B, 20000, 42) === 1.0);
const pAD = E.monteCarlo(A, Dv, 50000, 42);
ok('P(A>D) ≈ 0.97 (Wolfram: 0.9706)', near(pAD, 0.97, 0.015), pAD);

console.log('— gates —');
const late = E.score(D.orgs.find(o => o.id === 'fbi-mobile'), donation);
ok('mobile pantry deadline-gated for a 7pm-today donation (with all gate reasons listed)',
  late.gated && late.reasons.some(r => r.includes('deadline')), late.reasons);
const noAttest = E.score(D.orgs.find(o => o.id === 'dmarc-partner'), { ...donation, attested: false });
ok('missing attestation gates out', noAttest.gated && noAttest.reasons[0].includes('attestation'));

console.log('— tax & impact math —');
ok('one-time example: basis 200, FMV 500 → $350', E.enhancedDeduction(500, 200) === 350);
const weekly = E.taxEstimate(40 * 52);
ok('weekly-40-meals donor → $3,660.80/yr', weekly.fmv === 7321.6 && weekly.deduction === 3660.8, weekly);
const once = E.taxEstimate(40);
ok('single 40-meal donation → $70.40 est.', once.deduction === 70.4, once);
const imp = E.impact(40);
ok('40 meals = 48 lbs = $140.80', imp.lbs === 48 && imp.value === 140.8, imp);

console.log('— parser —');
const p1 = AI.parseDonation('40 vegetarian prepared meals, refrigerated, need gone by 7pm');
ok('parses type=prepared qty=40 diet=vegetarian storage=refrigerated',
  p1.type === 'prepared' && p1.qty === 40 && p1.diet === 'vegetarian' && p1.storage === 'refrigerated', p1);
ok('parses evening deadline (this evening ±2h)', p1.deadlineMin > 60 && p1.deadlineMin < 480, p1.deadlineMin);
const p2 = AI.parseDonation('200 lbs of mixed vegetables, ambient, tomorrow afternoon');
ok('parses produce/200/tomorrow', p2.type === 'produce' && p2.qty === 200 && p2.deadlineMin > 600, p2);
const p3 = AI.parseDonation('30 bread and pastries');
ok('parses bakery/30', p3.type === 'bakery' && p3.qty === 30, p3);
const p4 = AI.parseDonation('we need 30 halal meals Friday night');
ok('need-post parses meals/30/halal', p4.type === 'prepared' && p4.qty === 30 && p4.diet === 'halal', p4);

console.log('— explanation —');
const why = AI.explainMatch(byId['dmarc-partner'], donation);
ok('why-string mentions full quantity + low stock', /full 40/i.test(why) && /running low/i.test(why), why);
const whyPartial = AI.explainMatch(byId['hope-shelter'], donation);
ok('partial-capacity why is honest', /30 of 40/i.test(whyPartial), whyPartial);

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
