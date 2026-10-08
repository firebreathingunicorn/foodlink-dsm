/* Prompt-layer tests — run: node test/prompts.test.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const P = require('../app/js/prompts.js');
const AI = require('../app/js/ai.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, detail !== undefined ? '→ ' + JSON.stringify(detail) : ''); }
}

console.log('— prompt pack —');
ok('versioned', /^\d+\.\d+\.\d+$/.test(P.VERSION), P.VERSION);
const snap = { availableNow: [{ food: '40x prepared (vegetarian)' }], needsPosted: [], orgs: [] };
const sys = P.assistantSystem(snap);
ok('assistant prompt is grounded in live inventory', sys.includes('LIVE INVENTORY') && sys.includes('40x prepared'));
ok('anti-hallucination rule present', /Never invent food/.test(sys));
ok('no-guarantee rule present', /Never promise food/.test(sys));
ok('dignity rule present', /Everyone eats/.test(sys));
ok('crisis escalation present', sys.includes('211') && sys.includes('911'));
ok('language mirroring rule present', /same language/.test(sys));
ok('parse prompt is a strict JSON contract with few-shots', P.PARSE_SYSTEM.includes('ONLY a JSON object') &&
  P.PARSE_SYSTEM.split('Note:').length >= 4);
ok('explain prompt forbids invention', /Do not invent new facts/.test(P.EXPLAIN_SYSTEM));
ok('explain user payload carries engine facts + FDIA flag',
  JSON.parse(P.explainUser(
    { factors: { urgency: 1, distance: 1, capacity: 1, transport: 1 }, score: 0.82,
      org: { name: 'X', miles: 2, capacityMax: 40, direct: true } },
    { type: 'prepared', qty: 40, deadlineLabel: 'by 7 PM' })).allowed_direct === true);

console.log('— AI layer (offline mode) —');
ok('extractJSON tolerates prose around JSON', AI.extractJSON('Sure! {"a":1} done').a === 1);
AI.parseDonationSmart('40 vegetarian prepared meals, refrigerated, need gone by 7pm').then(p => {
  ok('no-AI config falls back to template parser', p.via === 'template' && p.qty === 40 && p.type === 'prepared', p);
  AI.testConnection().then(r => {
    ok('testConnection reports failure honestly offline', r.ok === false);
    console.log('\n' + pass + ' passed, ' + fail + ' failed');
    process.exit(fail ? 1 : 0);
  });
});
