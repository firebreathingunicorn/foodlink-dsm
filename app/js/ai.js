/* FoodLink assistant — one honest helper with three jobs:
   1) parse a free-text donation into structured fields (template parser, works offline;
      optional LLM hook via window.FoodLinkLLM when configured)
   2) generate the plain-English "why this match" from the score components
   3) script the multilingual SMS conversation (demo) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoodLinkAI = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- 1. donation parser (template fallback, always available) ---------- */
  var TYPES = [
    [/(prepared\s*meal|hot\s*meal|meal|entree|wrap|sandwich(?!es)*|pizza|soup)/i, 'prepared'],
    [/(produce|vegetable|veggie|fruit|salad|greens|corn|apple)/i, 'produce'],
    [/(bread|pastry|bagel|donut|baked|bakery|muffin|croissant)/i, 'bakery'],
    [/(milk|yogurt|cheese|dairy|egg)/i, 'dairy'],
    [/(canned|can[s]?\s|rice|beans|pasta|shelf[- ]?stable|boxed|cereal)/i, 'shelf-stable'],
    [/(frozen)/i, 'frozen']
  ];
  var DIETS = [
    [/gluten[- ]?free/i, 'gluten-free'], [/vegetarian/i, 'vegetarian'],
    [/vegan/i, 'vegan'], [/halal/i, 'halal'], [/kosher/i, 'kosher']
  ];
  var STORAGE = [
    [/(refrigerat|fridge|cold)/i, 'refrigerated'], [/frozen|freezer/i, 'frozen'],
    [/(hot|warm)/i, 'hot']
  ];

  function parseDonation(text) {
    text = String(text || '');
    var out = { raw: text.trim(), type: null, qty: null, diet: '', storage: 'ambient', deadlineMin: 180, deadlineLabel: 'in ~3 hours' };

    for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0].test(text)) { out.type = TYPES[i][1]; break; }
    if (!out.type) for (i = 0; i < TYPES.length; i++) { /* second pass: plural sandwiches */
      if (new RegExp(TYPES[i][1].replace('-', '\\-'), 'i').test(text)) { out.type = TYPES[i][1]; break; }
    }

    var m = text.match(/(\d{1,4})\s*(?:x|lbs|pounds|meals|servings|boxes|bags|units)?/i);
    if (m) out.qty = parseInt(m[1], 10);

    for (i = 0; i < DIETS.length; i++) if (DIETS[i][0].test(text)) { out.diet = DIETS[i][1]; break; }
    for (i = 0; i < STORAGE.length; i++) if (STORAGE[i][0].test(text)) { out.storage = STORAGE[i][1]; break; }
    if (/shelf[- ]?stable|canned|boxed/i.test(text)) out.storage = 'ambient';

    m = text.match(/by\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (m) {
      var h = parseInt(m[1], 10) % 12, min = m[2] ? parseInt(m[2], 10) : 0;
      var pm = (m[3] || '').toLowerCase() === 'pm' || /pm/i.test(text) || h + 12 <= 23 && m[1] <= 7 && !/am/i.test(text);
      var target = new Date(); target.setHours((m[3] ? (m[3].toLowerCase() === 'pm' ? h + 12 : h) : (m[1] <= 7 ? h + 12 : h)), min, 0, 0);
      out.deadlineMin = Math.max(15, Math.round((target - Date.now()) / 60000));
      out.deadlineLabel = 'by ' + m[1] + (m[2] ? ':' + m[2] : '') + ' ' + (m[3] || 'PM').toUpperCase();
    } else if (/tonight/i.test(text)) { out.deadlineMin = 240; out.deadlineLabel = 'tonight'; }
    else if (/tomorrow/i.test(text)) { out.deadlineMin = 1380; out.deadlineLabel = 'tomorrow'; }

    if (out.type === 'shelf-stable') out.storage = 'ambient';
    if (!out.type) out.type = 'prepared'; // demo default
    if (!out.qty) out.qty = 20;
    return out;
  }

  /* Optional real-LLM hook: set window.FoodLinkLLM = async (prompt) => jsonText, and
     the parser will prefer it, falling back to templates on any error. */
  function parseDonationSmart(text) {
    if (typeof root !== 'undefined' && root.FoodLinkLLM) {
      return root.FoodLinkLLM(
        'Extract JSON {type: prepared|produce|bakery|dairy|shelf-stable|frozen, qty: number, diet: string, ' +
        'storage: refrigerated|frozen|hot|ambient, deadlineMinFromNow: number} from this donation note: "' + text + '"'
      ).then(function (json) {
        var p = JSON.parse(json);
        return Object.assign(parseDonation(text), p);
      }).catch(function () { return parseDonation(text); });
    }
    return Promise.resolve(parseDonation(text));
  }

  /* ---------- 2. explainable "why" ---------- */
  var LABELS = { prepared: 'prepared meals', produce: 'fresh produce', bakery: 'bakery items',
    dairy: 'dairy', 'shelf-stable': 'shelf-stable items', frozen: 'frozen food' };
  function labelType(t) { return LABELS[t] || t; }

  function explainMatch(match, donation) {
    if (match.gated) return 'Gated: ' + match.reasons.join('; ') + '.';
    var f = match.factors, org = match.org, parts = [];
    if (f.capacity >= 1) parts.push('can take the full ' + donation.qty);
    else parts.push('can only take ' + Math.round(org.capacityMax * 1) + ' of ' + donation.qty);
    parts.push(org.miles <= 2.5 ? 'close by (' + org.miles + ' mi)' : org.miles + ' mi out');
    parts.push(f.urgency >= 0.7 ? 'running low on ' + labelType(donation.type) + ' tonight'
                                : 'not short on ' + labelType(donation.type) + ' tonight');
    var s = org.short + ' ' + parts.join(', ') + '.';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function explainTop(donation, best, rival) {
    var base = 'Closest organization that can take the ' + (best.factors.capacity >= 1 ? 'full quantity' : 'largest share') +
      ' before your ' + (donation.deadlineLabel || 'deadline') + ', and it' +
      (best.factors.urgency >= 0.7 ? "'s running low on " + labelType(donation.type) + ' tonight.' : ' isn\'t short tonight.');
    if (rival && !rival.gated) {
      var dom = true, keys = ['urgency', 'distance', 'capacity', 'transport'];
      for (var i = 0; i < keys.length; i++) if (rival.factors[keys[i]] > best.factors[keys[i]]) dom = false;
      if (dom) return base;
      return base + ' (Verified: #1 stays on top in ~' + Math.round(best.vsRivalP * 100) + '% of weightings.)';
    }
    return base;
  }

  /* ---------- 3. SMS demo script ---------- */
  function smsScript(lang) {
    if (lang === 'es') return [
      { me: true,  t: 'FOOD' },
      { me: false, t: '¡Hola! Soy FoodLink. ¿Qué necesitas hoy? Responde 1 comidas, 2 despensa, 3 ambos.' },
      { me: true,  t: '1' },
      { me: false, t: 'Hoy cerca de ti: 40 comidas vegetarianas, despensa socio de DMARC, 1.4 mi, distrib. hoy 4–7 PM sin cita. Responde MAPA para direcciones.' },
      { me: true,  t: 'MAPA' },
      { me: false, t: '📍 Eastside Community Pantry, Des Moines. Abierto hasta las 6 PM. Trae tu bolsa. ¡Buen provecho! 💚' }
    ];
    return [
      { me: true,  t: 'FOOD' },
      { me: false, t: 'Hi! FoodLink here. What do you need today? Reply 1 meals, 2 pantry groceries, 3 both.' },
      { me: true,  t: '1' },
      { me: false, t: 'Near you today: 40 vegetarian meals via a DMARC partner pantry, 1.4 mi, distribution 4–7 PM, no appointment. Reply MAP for directions.' },
      { me: true,  t: 'MAP' },
      { me: false, t: '📍 Eastside Community Pantry, Des Moines. Open till 6 PM — bring a bag. Take care! 💚' }
    ];
  }

  return { parseDonation: parseDonation, parseDonationSmart: parseDonationSmart,
           explainMatch: explainMatch, explainTop: explainTop, smsScript: smsScript };
});
