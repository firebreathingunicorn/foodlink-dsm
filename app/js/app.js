/* FoodLink app — hash-routed views. Classic script; globals: Engine, Data, AI, I18N. */
(function () {
  'use strict';
  var E = window.FoodLinkEngine, D = window.FoodLinkData, AI = window.FoodLinkAI, I = window.FoodLinkI18N;

  var store = {
    listings: JSON.parse(JSON.stringify(D.listings)),
    needs: JSON.parse(JSON.stringify(D.needs)),
    impact: JSON.parse(localStorage.getItem('foodlink-impact') || '{"meals":0,"donations":0,"orgs":[]}'),
    draft: null, lang: 'en', filter: 'all', query: '',
    chat: [], chatBusy: false,
    tour: { active: false, i: 0 }, openCard: null
  };

  /* ---------- guided tour ---------- */
  var EXAMPLE = '40 vegetarian prepared meals, refrigerated, need gone by 7pm';
  var TOUR = [
    { hash: 'home', text: '👋 This is the live food grid — surplus on one side, need on the other. Let\'s walk it in 7 quick steps.' },
    { hash: 'donate', text: 'STEP 1 · Describe your food in one sentence — we typed an example for you. Then tap “Find where it should go”.', prefill: true },
    { hash: 'match', text: 'STEP 2 · FoodLink checked every organization. Gated ones show WHY they were rejected. The top match is 82.4%. Tap “Connect →”.', ensureDraft: true },
    { hash: 'receipt', text: 'STEP 3 · Done — an impact receipt: 48 lbs, $140.80 value, tax estimate. Every donation gets one automatically.', ensureDraft: true },
    { hash: 'need', text: 'Now the household side — no login, no documents, honest cards. Tap any card for details; switch to Español.' },
    { hash: 'sms', text: '💬 Any phone works — the assistant answers in any language. Try a quick-question chip below.' },
    { hash: 'needs-board', text: '📢 Organizations post what they NEED — and the network exports its own open data. That\'s the whole grid. Tap Finish.' }
  ];
  function tourStart() { store.tour = { active: true, i: 0 }; location.hash = TOUR[0].hash; render(); }
  function tourNext() {
    var t = store.tour; t.i++;
    if (t.i >= TOUR.length) { store.tour = { active: false, i: 0 }; location.hash = 'home'; render(); toast('🎉 That\'s the whole grid — explore freely!'); return; }
    var step = TOUR[t.i];
    if (step.ensureDraft && (!store.draft || store.draft.raw !== EXAMPLE)) {
      var d = AI.parseDonation(EXAMPLE); d.attested = true; d.directOffer = false; store.draft = d;
    }
    if (step.prefill) store.tourPrefill = true; else store.tourPrefill = false;
    if (location.hash === '#' + step.hash) render(); else location.hash = step.hash;
  }
  function tourBarHTML() {
    var t = store.tour, step = TOUR[t.i];
    if (!step) return '';
    return '<div class="tourbar"><div class="tmeta">Tour ' + (t.i + 1) + '/' + TOUR.length +
      (step.prefill ? ' · we filled the form for you' : '') + '</div><div class="ttext">' + esc(step.text) + '</div>' +
      '<div class="tbtns"><button class="btn tbtn-exit" data-tour="exit">Exit</button>' +
      '<button class="btn btn-primary tbtn-next" data-tour="next">' + (t.i === TOUR.length - 1 ? 'Finish ✓' : 'Next →') + '</button></div></div>';
  }
  function ensureDraftNow() {
    if (!store.draft || store.draft.raw !== EXAMPLE) {
      var d = AI.parseDonation(EXAMPLE); d.attested = true; d.directOffer = false; store.draft = d;
    }
  }
  function saveImpact() { localStorage.setItem('foodlink-impact', JSON.stringify(store.impact)); }

  /* ---------- live grid: cross-window sync + real expiry ---------- */
  var BOOT = Date.now();
  var bc = null;
  try { bc = new BroadcastChannel('foodlink-grid'); } catch (e) { /* older browsers */ }
  if (bc) bc.onmessage = function (e) {
    var m = e.data;
    if (!m || m.type !== 'sync') return;
    store.listings = m.listings; store.needs = m.needs;
    if (m.impact && (m.impact.meals || 0) > (store.impact.meals || 0)) store.impact = m.impact;
    render(); toast('📡 Live — the grid just updated from another window');
  };
  function publish() { if (bc) bc.postMessage({ type: 'sync', listings: store.listings, needs: store.needs, impact: store.impact }); }
  function isExpired(l) { return Date.now() > BOOT + l.deadlineMin * 60000; }
  function liveListings() { return store.listings.filter(function (l) { return !l.claimedBy && !isExpired(l); }); }
  function agoText(l) {
    var m = Math.max(0, Math.round((Date.now() - (BOOT + l.postedMin * 60000)) / 60000));
    return m <= 0 ? 'posted just now' : 'posted ' + m + ' min ago';
  }
  setInterval(function () {
    var before = store.listings.length;
    store.listings = store.listings.filter(function (l) { return !isExpired(l); });
    if (store.listings.length !== before) { publish(); render(); toast('⏰ A listing hit its deadline and left the board.'); }
  }, 20000);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtTime(minFromNow) {
    var d = new Date(Date.now() + minFromNow * 60000), h = d.getHours(), m = d.getMinutes();
    return ((h % 12) || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' AM' : ' PM');
  }
  function toast(msg) {
    var t = document.querySelector('.toast') || Object.assign(document.createElement('div'), { className: 'toast' });
    document.body.appendChild(t); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function snapshot() { // live data handed to the AI
    return {
      availableNow: store.listings.filter(function (l) { return !l.claimedBy; }).map(function (l) {
        return { food: l.qty + 'x ' + l.type + (l.diet ? ' (' + l.diet + ')' : ''),
                 via: l.distribution.org, window: l.distribution.window, note: l.distribution.note };
      }),
      needsPosted: store.needs.map(function (n) { return n.org + ' needs ' + n.qty + ' ' + n.type + ' by ' + n.by; }),
      orgs: D.orgs.map(function (o) {
        return { name: o.name, miles: o.miles, hours: o.hours, languages: o.languages || ['en'], serves: o.serves || '' };
      })
    };
  }

  /* ---------------- views ---------------- */
  var views = {};

  views.home = function () {
    var live = liveListings().length;
    var am = AI.activeModel();
    return '' +
    '<div class="toprow"><div class="brand"><div class="logo">🌽</div><div><b>FoodLink</b>' +
    '<small>The real-time food grid · Des Moines</small></div></div>' +
    '<a class="gear" href="#settings" title="AI settings">⚙️</a></div>' +
    '<span class="tag"><i></i>' + live + ' surplus · ' + store.needs.length + ' needs on the board right now</span>' +
    '<a class="tourlink" data-tour-start="1">▶ New here? Take the 60-second tour</a>' +
    '<a class="btn-big btn-need" href="#need">🍅 I need food<span>Free food near you, today — no sign-up</span></a>' +
    '<a class="btn-big btn-have" href="#donate">🏪 I have food<span>Businesses &amp; organizations: post surplus in one sentence</span></a>' +
    '<div class="lane">💬 <div><b>Any phone, any language.</b> Chat with FoodLink — on a smartphone or a flip phone. ' +
    '<a href="#sms">Open the assistant</a>' + (am.live ? ' · <span class="ai-badge on">' + esc(am.model) + '</span>' : ' · <span class="ai-badge">offline demo mode</span>') + '</div></div>' +
    '<div class="gridmini"><h4>The Grid — live</h4>' + gridHTML() +
    '<div class="legend"><span><i style="background:var(--blue-600)"></i>surplus</span>' +
    '<span><i style="background:var(--red-600)"></i>need</span>' +
    '<span style="margin-left:auto">a closed circuit = food rescued</span></div>' +
    '<p class="ai-note" style="margin-top:8px">📡 Live grid: open a second window — post food in one, watch it appear in the other.</p></div>' +
    '<div class="gridmini"><h4>Your impact so far (this device)</h4><div class="card" style="margin:0">' +
    '<div class="meta" style="font-size:14px"><b style="font-size:22px;color:var(--green-700)">' + store.impact.meals +
    '</b> meals rescued · ' + store.impact.donations + (store.impact.donations === 1 ? ' donation' : ' donations') + ' · ' +
    E.impact(store.impact.meals).lbs + ' lbs diverted · $' + E.impact(store.impact.meals).value + ' in value</div></div></div>' +
    '<p class="footnote">All organizations and listings are simulated for this demo — no real partnership is claimed.</p>';
  };

  function gridHTML() {
    var pts = [[14, 28, 's'], [24, 42, 'n'], [46, 14, 's'], [72, 62, 's'], [56, 76, 'n'], [84, 30, 'n']];
    var dx = (pts[1][0] - pts[0][0]) / 100 * 380, dy = (pts[1][1] - pts[0][1]) / 100 * 88;
    var line = '<div class="link-line" style="left:' + pts[0][0] + '%;top:' + pts[0][1] +
      '%;width:' + Math.sqrt(dx * dx + dy * dy).toFixed(0) + 'px;transform:rotate(' +
      (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + 'deg)"></div>';
    var dots = pts.map(function (p, i) {
      return '<div class="dot ' + p[2] + (i % 2 ? ' pulse' : '') + '" style="left:' + p[0] + '%;top:' + p[1] + '%"></div>';
    }).join('');
    return '<div class="dots">' + line + dots + '</div>';
  }

  /* ---------- settings (AI provider) ---------- */
  views.settings = function () {
    var c = AI.getConfig(), am = AI.activeModel();
    var opts = Object.keys(AI.DEFAULTS).map(function (p) {
      return '<option value="' + p + '"' + (c.provider === p ? ' selected' : '') + '>' + AI.DEFAULTS[p].label + '</option>';
    }).join('');
    return '' +
    '<a class="back" href="#home">← Home</a>' +
    '<h3 class="sec">AI engine</h3>' +
    '<p class="sub">FoodLink runs on free, open-source-friendly AI — or on built-in templates when no AI is configured. The demo never dies offline.</p>' +
    '<div class="card"><div class="k">Provider</div>' +
    '<select class="txt" id="aiProvider" style="margin-top:8px">' + opts + '</select>' +
    '<div id="aiKeyRow" style="' + (c.provider === 'template' || c.provider === 'ollama' ? 'display:none;' : '') + 'margin-top:10px">' +
    '<div class="k">API key (free — paste yours)</div>' +
    '<input class="txt" id="aiKey" type="password" placeholder="paste key" value="' + esc(c.key) + '" style="margin-top:6px">' +
    '</div>' +
    '<div id="aiModelRow" style="margin-top:10px"><div class="k">Model (optional)</div>' +
    '<input class="txt" id="aiModel" placeholder="' + esc(AI.DEFAULTS[c.provider].model || '') + '" value="' + esc(c.model) + '" style="margin-top:6px"></div>' +
    '<button class="btn btn-primary" id="aiSave">Save &amp; test connection</button>' +
    '<div id="aiStatus" class="ai-note">Currently: <b>' + esc(am.label) + (am.model ? ' · ' + esc(am.model) : '') + '</b></div>' +
    '</div>' +
    '<div class="card"><div class="k">Free options (no credit card)</div>' +
    '<div class="meta" style="margin-top:6px;line-height:1.7">' +
    '• <b>Ollama</b> — open-source models, 100% local, zero cost: <code>OLLAMA_ORIGINS=* ollama serve</code><br>' +
    '• <b>Groq</b> — free API key at console.groq.com<br>' +
    '• <b>Gemini</b> — free key at aistudio.google.com<br>' +
    '• <b>OpenRouter</b> — free models at openrouter.ai<br>' +
    '• No AI? Everything still works — parsing falls back to FoodLink\'s built-in templates.</div></div>';
  };

  /* ---------- donate ---------- */
  views.donate = function () {
    var d = store.draft;
    return '' +
    '<a class="back" href="#home">← Home</a>' + stepper(1) +
    '<h3 class="sec">Post surplus</h3>' +
    '<p class="sub">Type it like you\'d text a coworker. FoodLink does the rest.</p>' +
    '<textarea class="post" id="postText" placeholder="e.g. 40 vegetarian prepared meals, refrigerated, need gone by 7pm">' +
    esc(d ? d.raw : '') + '</textarea>' +
    '<div id="parseOut">' + (d ? parseHTML(d) : '<p class="ai-note">The assistant reads your note and pulls out food type, quantity, storage and deadline.</p>') + '</div>' +
    '<label class="check"><input type="checkbox" id="attest"> I attest this food has been held at safe temperatures ' +
    'and will be labeled for allergens.</label>' +
    '<label class="check"><input type="checkbox" id="directOffer"> 🍽️ Direct delivery to a nearby household tonight — ' +
    'protected for donors by the Food Donation Improvement Act of 2023.</label>' +
    '<button class="btn btn-primary" id="findMatch" disabled>Find where it should go →</button>' +
    '<p class="ai-note" id="viaNote"></p>';
  };

  function parseHTML(d) {
    return '<div class="parsed"><b>✓ FoodLink read your note' + (d.via && d.via !== 'template' ? ' (AI: ' + esc(d.via) + ')' : '') + '</b>' +
      '<span class="chip">🍱 ' + esc(E.labelType(d.type)) + '</span>' +
      '<span class="chip">× ' + d.qty + '</span>' +
      '<span class="chip">' + (d.storage === 'refrigerated' ? '❄️' : d.storage === 'frozen' ? '🧊' : '📦') + ' ' + d.storage + '</span>' +
      (d.diet ? '<span class="chip">🌱 ' + d.diet + '</span>' : '') +
      '<span class="chip">⏰ ' + esc(d.deadlineLabel) + '</span></div>';
  }

  /* ---------- match ---------- */
  function directHouseholdOrg(d) { // FDIA 2023 qualified-direct-donor route
    return { id: 'direct-household', name: 'Direct to a nearby household', short: 'nearby household',
      miles: 1.2, accepts: ['prepared'], storage: ['refrigerated', 'hot', 'ambient', 'frozen'],
      capacityMax: d.qty, needLevel: 0.85, transport: 0.45, nextReceiveMin: 0,
      hours: 'tonight', direct: true, serves: 'a family that posted tonight\'s need' };
  }
  views.match = function () {
    var d = store.draft;
    if (!d) { location.hash = '#donate'; return ''; }
    var orgs = D.orgs.slice();
    var directAllowed = d.directOffer && d.type === 'prepared' && d.qty <= 100;
    if (directAllowed) orgs.push(directHouseholdOrg(d));
    var ranked = E.rank(orgs, d);
    var best = ranked.filter(function (r) { return !r.gated; })[0];
    var rival = ranked.filter(function (r) { return !r.gated; })[1];
    if (best) best.vsRivalP = rival ? E.monteCarlo(best.factors, rival.factors, 20000) : 1;
    var out = '<a class="back" href="#donate">← Edit post</a>' + stepper(2) +
      '<h3 class="sec">Where your ' + d.qty + ' ' + esc(E.labelType(d.type)) + ' should go</h3>' +
      '<p class="sub">Ranked by the match score — math shown, nothing hidden.</p>';
    ranked.forEach(function (m, i) {
      if (m.gated) {
        out += '<div class="match gated"><div class="head"><b>' + esc(m.org.name) + '</b><span class="score">—</span></div>' +
          '<div class="meta">📍 ' + m.org.miles + ' mi · ' + esc(m.org.hours) + '</div>' +
          m.reasons.map(function (r) { return '<span class="tag-gate">✕ GATED — ' + esc(r) + '</span>'; }).join(' ') + '</div>';
        return;
      }
      var f = m.factors, top = i === 0;
      var why = m.org.direct
        ? 'Hot meals straight to a family tonight — no detour, no cooling-window risk. Donors are protected by the Food Donation Improvement Act of 2023.'
        : AI.explainMatch(m, d);
      out += '<div class="match' + (top ? ' top' : '') + '"><div class="head"><b>' + esc(m.org.name) + '</b>' +
        '<span class="score">' + (m.score * 100).toFixed(1) + '<small>%</small></span></div>' +
        (m.org.direct ? '<span class="fdia-badge">Direct-to-household · FDIA 2023</span>' : '') +
        '<div class="meta">📍 ' + m.org.miles + ' mi · ' + (f.capacity >= 1 ? 'can take all ' + d.qty : 'can take ' + m.org.capacityMax + ' of ' + d.qty) +
        ' · ' + esc(m.org.hours) + '</div>' +
        '<div class="bars">' + bar('urgency .35', f.urgency) + bar('distance .30', f.distance) +
        bar('capacity .20', f.capacity) + bar('transport .15', f.transport) + '</div>' +
        '<div class="why" id="why-top">“' + esc(why) + '”</div>' +
        (top ? '<button class="btn btn-primary" data-connect="' + m.org.id + '">Connect →</button>' : '') +
        '</div>';
    });
    out += '<p class="footnote">Weights are visible on every bar. Robustness tested by simulation: the top ranking holds in ~' +
      (best ? Math.round(best.vsRivalP * 100) : 100) + '% of random weightings.' +
      (AI.activeModel().live ? ' Explanation phrased by AI from engine-computed facts.' : '') + '</p>';
    // AI rephrases the top "why" — engine numbers stay the source of truth.
    if (best && AI.activeModel().live) {
      AI.explainTopAI(best, d).then(function (s) {
        var el = document.getElementById('why-top');
        if (el) el.innerHTML = '“' + esc(s) + '” <span class="ai-badge on">AI-phrased · engine-computed</span>';
      }).catch(function () { /* template stays */ });
    }
    return out;
  };

  function bar(label, v) {
    return '<div class="bar"><span>' + label + '</span><div class="track"><div class="fill" style="width:' +
      Math.round(v * 100) + '%"></div></div><span>' + v.toFixed(2) + '</span></div>';
  }
  function stepper(n) {
    var labels = ['Describe it', 'Where it goes', 'Receipt'];
    return '<div class="stepper">' + labels.map(function (l, i) {
      return '<span class="s' + (i + 1 === n ? ' now' : i + 1 < n ? ' done' : '') + '">' +
        (i + 1 < n ? '✓' : i + 1) + ' ' + l + '</span>';
    }).join('<i>›</i>') + '</div>';
  }

  /* ---------- receipt ---------- */
  views.receipt = function () {
    var d = store.draft;
    if (!d) { location.hash = '#home'; return ''; }
    var imp = E.impact(d.qty), tax = E.taxEstimate(d.qty), yr = E.taxEstimate(d.qty * 52);
    return '' +
    '<a class="back" href="#home">← Home</a>' + stepper(3) +
    '<h3 class="sec">Impact receipt</h3>' +
    '<p class="sub">Every donation closes the loop — for the business and the IRS.</p>' +
    '<div class="receipt" id="receiptCard">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
    '<div><div class="k" style="font-size:11px;font-weight:700;color:var(--green-700);letter-spacing:.06em;text-transform:uppercase">Today\'s donation</div>' +
    '<div class="big">' + d.qty + ' meals 🌽</div></div>' +
    '<div class="qr">QR<br>verified<br>impact page</div></div>' +
    '<div class="row"><span>Food diverted from waste</span><b>' + imp.lbs + ' lbs</b></div>' +
    '<div class="row"><span>Value at Iowa avg ($' + E.IOWA_MEAL_COST + '/meal)</span><b>$' + imp.value + '</b></div>' +
    '<div class="row"><span>Community organizations served</span><b>1</b></div>' +
    (d.directDone ? '<div class="row"><span>Route</span><b>Direct-to-household · FDIA 2023</b></div>' : '') +
    '<div class="row"><span>Potential tax deduction (est.)</span><b>$' + tax.deduction.toFixed(2) + '</b></div>' +
    '<div class="row"><span>This pattern, all year →</span><b>$' + yr.deduction.toFixed(2) + '</b></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="window.print()">⬇ Save / print receipt</button>' +
    '<p class="tax-note">Estimates only — IRC §170(e)(3): basis + ½ of expected gain, capped at 2× basis ' +
    '(25%-of-FMV basis election assumed). Not tax advice.</p>' +
    '<a class="btn btn-ghost" href="#need">See what households see →</a>';
  };

  /* ---------- find food (household) — richer ---------- */
  views.need = function () {
    var es = I.get() === 'es';
    var q = store.query.toLowerCase();
    var cards = liveListings().filter(function (l) {
      if (store.filter === 'today' && l.deadlineMin > 1440) return false;
      if (store.filter === 'veg' && l.diet !== 'vegetarian') return false;
      if (q && (l.type + ' ' + l.diet + ' ' + l.distribution.org + ' ' + l.distribution.window).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).map(function (l) {
      var org = D.orgs.find(function (o) { return o.name === l.distribution.org; });
      var mi = org ? org.miles : 1.4;
      var openNow = org && org.nextReceiveMin === 0;
      var lbl = l.deadlineMin <= 1440 ? I.t('today') + ' · ' + I.t('until') + ' ' + fmtTime(l.deadlineMin) : I.t('sat');
      var win = es ? (l.distribution.windowEs || l.distribution.window) : l.distribution.window;
      var note = es ? (l.distribution.noteEs || l.distribution.note) : l.distribution.note;
      var isOpen = store.openCard === l.id;
      var detail = isOpen
        ? '<div class="card-detail">' +
          (org ? '<div>🕒 ' + esc(org.hours) + (org.languages ? ' · 🗣 ' + org.languages.join('/').toUpperCase() : '') + '</div>' : '') +
          (org && org.serves ? '<div>' + esc(org.serves) + '</div>' : '') +
          '<div>🪪 ' + (es ? 'No se necesita ID aquí — las despensas usan auto-declaración.' : 'No ID needed here — pantries use self-attestation.') + '</div>' +
          '<div>🎒 ' + (es ? 'Trae una bolsa.' : 'Bring a bag.') + '</div></div>'
        : '';
      return '<div class="card' + (isOpen ? ' open' : '') + '" data-expand="' + l.id + '" role="button">' +
        '<span class="pill ' + (l.deadlineMin <= 1440 ? 'now' : 'ok') + '">' + lbl + '</span>' +
        '<div class="k">' + I.t(l.type) + '</div><h5>' + l.qty + ' ' + I.t(l.type) +
        (l.diet ? ' · ' + I.diet(l.diet) : '') + '</h5>' +
        '<div class="meta">📍 ' + mi + ' mi · ' + I.t('via') + ' ' + esc(l.distribution.org) +
        (openNow ? ' <span class="open-badge">● open now</span>' : '') + ' · ' + agoText(l) + '</div>' +
        '<div class="honest">' + I.t('dist') + ': ' + esc(win) + (note ? ' · ' + esc(note) : '') + ' · <b>' + I.t('confirmed') + '</b></div>' +
        detail +
        '<div class="tap-hint">' + (isOpen ? (es ? '▲ tocar para cerrar' : '▲ tap to close') : (es ? '▼ tocar para detalles' : '▼ tap for details')) + '</div></div>';
    }).join('');

    var maxMi = 6.5, rail = D.orgs.filter(function (o) {
      return store.listings.some(function (l) { return l.distribution.org === o.name && !l.claimedBy; }) ||
             o.needLevel >= 0.8;
    }).map(function (o, i) {
      var has = store.listings.some(function (l) { return l.distribution.org === o.name; });
      var left = Math.min(94, (o.miles / maxMi) * 100);
      return '<div class="rail-org' + (i % 2 ? ' alt' : '') + '" style="left:' + left + '%">' +
        '<span class="rdot ' + (has ? 'has' : '') + '"></span>' +
        '<span class="rlabel">' + o.miles + ' mi</span></div>';
    }).join('');

    return '' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
    '<div class="seg"><button data-lang="en" class="' + (I.get() === 'en' ? 'on' : '') + '">English</button>' +
    '<button data-lang="es" class="' + (I.get() === 'es' ? 'on' : '') + '">Español</button></div>' +
    '<a class="back" style="margin:0" href="#sms">💬 ' + (es ? 'Asistente' : 'Assistant') + '</a></div>' +
    '<h3 class="sec">' + I.t('title') + '</h3><p class="sub">' + I.t('sub') + '</p>' +
    '<input class="txt" id="searchFood" placeholder="' + (es ? 'Buscar comida o lugar…' : 'Search food or a place…') + '" value="' + esc(store.query) + '">' +
    '<div class="filters">' + ['all', 'today', 'veg'].map(function (f) {
      return '<button data-filter="' + f + '" class="' + (store.filter === f ? 'on' : '') + '">' +
        I.t(f === 'all' ? 'all' : f === 'today' ? 'filterToday' : 'filterVeg') + '</button>';
    }).join('') + '</div>' +
    '<p class="count-line"><b>' + liveListings().length + '</b> ' +
    (es ? 'lugares tienen comida ahora mismo' : 'places have food right now') + '</p>' +
    '<div class="railwrap"><div class="railline"></div>' + rail + '</div>' +
    (cards || '<div class="card"><div class="meta">' + (es ? 'Nada ahora — prueba el asistente.' : 'Nothing right now — try the assistant or check back soon.') + '</div></div>') +
    realResourcesHTML(es) +
    '<p class="footnote">' + I.t('expiry') + '</p>';
  };

  function realResourcesHTML(es) {
    return '<div class="gridmini"><h4>' + (es ? 'Recursos reales cerca de ti' : 'Real food resources, right now') + '</h4>' +
      '<p class="ai-note" style="margin:0 0 10px">' + (es ? 'Directorio público — llama para confirmar horarios.' :
      'Public directory (official sources). Call ahead to confirm hours — the live surplus board above is the simulated part.') + '</p>' +
      D.directory.map(function (r) {
        var first = r.phone.split('·')[0].trim();
        var digits = first.replace(/[^0-9+]/g, '');
        var call = (digits.length >= 7) ? '<a class="callbtn" href="tel:' + digits + '">📞 ' + esc(first) + '</a>'
                                        : '<span class="callbtn" style="background:var(--line)">' + esc(first) + '</span>';
        return '<div class="card dir"><div class="k">' + esc(r.name) + '</div>' +
          '<div class="meta">📍 ' + esc(r.addr) + '</div>' +
          '<div class="meta">🕒 ' + esc(r.hours) + '</div>' +
          '<div class="dirrow">' + call +
          '<a class="srclink" href="' + r.src + '" target="_blank" rel="noopener">source ↗</a></div></div>';
      }).join('') +
      '<div class="dirrow" style="justify-content:space-between;margin-top:2px">' +
      '<a class="srclink" href="' + D.meta.links.dmarcPantries + '" target="_blank" rel="noopener">All DMARC pantries ↗</a>' +
      '<a class="srclink" href="' + D.meta.links.fbiFindFood + '" target="_blank" rel="noopener">Food Bank of Iowa finder ↗</a></div></div>';
  }

  /* ---------- AI assistant (real chat) ---------- */
  views.sms = function () {
    var am = AI.activeModel();
    var thread = store.chat.length
      ? store.chat.map(function (m) {
          return '<div class="sms' + (m.me ? ' me' : '') + '">' + esc(m.t) + '</div>';
        }).join('')
      : AI.smsScript(I.get()).map(function (m) {
          return '<div class="sms' + (m.me ? ' me' : '') + '">' + esc(m.t) + '</div>';
        }).join('');
    return '' +
    '<a class="back" href="#need">← ' + I.t('title') + '</a>' +
    '<h3 class="sec">💬 ' + I.t('smsTitle') + '</h3>' +
    '<p class="sub">' + I.t('smsSub') + ' ' +
    (am.live ? '<span class="ai-badge on">● ' + esc(am.model) + '</span>'
             : '<span class="ai-badge">offline demo mode — add a free AI key in ⚙️</span>') + '</p>' +
    '<div class="sms-thread" id="chatThread">' + thread +
    (store.chatBusy ? '<div class="sms typing"><span></span><span></span><span></span></div>' : '') +
    '</div>' +
    '<div class="chips">' + ['I need food today', '¿Hay vegetales?', 'no ID — can I still get food?'].map(function (c) {
      return '<button class="chip-btn" data-say="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('') + '</div>' +
    '<div class="chatrow"><input class="txt" id="chatInput" placeholder="' +
    (am.live ? 'Type in any language…' : 'AI not configured — canned replies only') + '">' +
    '<button class="btn btn-primary" id="chatSend" style="width:auto;margin:0">➤</button></div>' +
    '<div class="chips" style="margin-top:10px">' +
    '<a class="btn btn-ghost" style="margin:0;width:auto" href="sms:+15155550100?&body=FOOD">📲 On your phone? Text FOOD (demo number)</a>' +
    '<a class="btn btn-ghost" style="margin:0;width:auto" href="#how">🔍 See the exact AI prompt &amp; context</a></div>' +
    '<p class="footnote">34% of low-income adults are smartphone-only; ~1 in 5 seniors own no smartphone (Pew 2025). ' +
    'The same assistant answers on SMS — NYC\'s Plentiful proved the pattern in 9 languages; FoodLink brings it to Des Moines.</p>';
  };

  /* ---------- how the AI works (full transparency) ---------- */
  views.how = function () {
    var am = AI.activeModel(), P = window.FoodLinkPrompts;
    return '' +
    '<a class="back" href="#sms">← Assistant</a>' +
    '<h3 class="sec">How the AI works</h3>' +
    '<p class="sub">No black boxes. The prompts are versioned, the context is grounded in live inventory, and every machine ' +
    'output is validated with a template fallback — the demo cannot die offline.</p>' +
    '<div class="card"><div class="k">Active engine</div>' +
    '<div class="meta" style="margin-top:6px"><b>' + esc(am.label) + (am.model ? ' · ' + esc(am.model) : '') + '</b>' +
    (am.live ? '' : ' — offline template mode') + '</div>' +
    '<div class="meta" style="margin-top:4px">Prompt pack v' + esc(P.VERSION) + ' · three prompts: parse, assist, explain.</div></div>' +
    '<div class="card"><div class="k">The 8 rules the assistant must obey</div>' +
    '<ol class="rules">' +
    '<li><b>Grounded:</b> only food in LIVE INVENTORY may be offered — never invented.</li>' +
    '<li><b>No guarantees:</b> never promises food or eligibility; pantries use self-attestation, no ID needed here.</li>' +
    '<li><b>Dignity:</b> no judgment, no politics; everyone eats.</li>' +
    '<li><b>Language:</b> mirrors the language you write in.</li>' +
    '<li><b>Short:</b> under 45 words, one question max.</li>' +
    '<li><b>Safety:</b> food logistics only; emergencies → 911; hungry kids tonight → fastest same-day item + 211.</li>' +
    '<li><b>Donors:</b> one-sentence pitch for how to post surplus.</li>' +
    '<li><b>On-topic</b> or one-line redirect.</li></ol></div>' +
    '<div class="card"><div class="k">The exact assistant prompt (live context)</div>' +
    '<pre class="promptbox">' + esc(P.assistantSystem(snapshot())) + '</pre></div>' +
    '<div class="card"><div class="k">The parse prompt (strict JSON contract)</div>' +
    '<pre class="promptbox">' + esc(P.PARSE_SYSTEM) + '</pre></div>' +
    '<div class="card"><div class="k">Match explanations</div>' +
    '<div class="meta">Scores and factors are computed by the tested engine — never by the AI. The AI only rephrases the ' +
    'plain-English “why” from engine-computed facts, and falls back to the template sentence if it drifts. ' +
    'The matching robustness (100k-draw Monte Carlo) is real math, not model output.</div></div>';
  };

  /* ---------- needs board + network pulse ---------- */
  function pulseHTML() {
    var imp = E.impact(store.impact.meals);
    var openNeeds = store.needs.length, met = store.listings.filter(function (l) { return l.claimedBy; }).length;
    var rows = [
      ['Meals rescued (this device)', store.impact.meals, 300],
      ['Lbs diverted', imp.lbs, 360],
      ['Food value, $', imp.value, 1100],
      ['Needs posted → matched', met + ' of ' + (openNeeds + met), openNeeds + met || 1]
    ];
    return '<div class="card"><div class="k">Network pulse · live data</div>' +
      rows.map(function (r) {
        return '<div class="prow"><span>' + r[0] + '</span><div class="ptrack"><div class="pfill" style="width:' +
          Math.min(100, Math.round(r[1] / r[2] * 100)) + '%"></div></div><b>' + r[1] + '</b></div>';
      }).join('') +
      '<button class="btn btn-ghost" id="exportData">⬇ Export network data (JSON)</button>' +
      '<p class="ai-note">Open export for any food-access organization — the challenge\'s data-collaboration bullet, working today.</p></div>';
  }
  views.needsBoard = function () {
    return '' +
    '<a class="back" href="#home">← Home</a>' +
    '<h3 class="sec">Needs Board</h3>' +
    '<p class="sub">The demand side posts too — surplus gets a destination <i>before</i> it\'s cooked.</p>' +
    pulseHTML() +
    store.needs.map(function (n) {
      return '<div class="card need"><div class="k">NEED · ' + esc(E.labelType(n.type)) + '</div>' +
        '<h5>' + esc(n.label) + '</h5>' +
        '<div class="meta">' + esc(n.org) + ' · by ' + esc(n.by) + (n.note ? ' · ' + esc(n.note) : '') + '</div></div>';
    }).join('') +
    '<div class="card"><div class="k">Post a need (organizations)</div>' +
    '<input class="txt" id="needText" placeholder="e.g. We need 30 halal meals Friday night" style="margin-top:8px">' +
    '<button class="btn btn-primary" id="postNeed">Post to the board</button>' +
    '<p class="ai-note">Needs are parsed by the same assistant — one sentence is enough.</p></div>';
  };

  /* ---------------- router ---------------- */
  views['needs-board'] = views.needsBoard; // tab href alias
  var TAB_FOR = { match: 'donate', receipt: 'donate', how: null, settings: null };
  function render() {
    var h = location.hash.replace('#', '') || 'home';
    var parts = h.split('/'), name = parts[0];
    var fn = views[name] || views.home;
    var tab = TAB_FOR[name] === undefined ? name : TAB_FOR[name];
    document.getElementById('app').innerHTML = fn();
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      a.classList.toggle('on', a.dataset.tab === tab);
    });
    bind(name);
    // first-run welcome
    if (!localStorage.getItem('foodlink-seen') && !document.getElementById('welcome')) {
      var w = document.createElement('div');
      w.className = 'welcome'; w.id = 'welcome';
      w.innerHTML = '<div class="wsheet"><div class="wlogo">🌽</div><h3>Welcome to FoodLink</h3>' +
        '<p>La red de alimentos en tiempo real de Des Moines.<br>Two doors: <b>food you need</b> or <b>food you have</b> — the grid connects them in minutes.</p>' +
        '<button class="btn btn-primary" data-w="tour">▶ Show me how it works (60 sec)</button>' +
        '<button class="btn btn-ghost" data-w="need">🍅 I need food</button>' +
        '<button class="btn btn-ghost" data-w="donate">🏪 I have food</button>' +
        '<button class="wskip" data-w="skip">explore on my own →</button></div>';
      document.body.appendChild(w);
      w.querySelectorAll('[data-w]').forEach(function (b) {
        b.addEventListener('click', function () {
          localStorage.setItem('foodlink-seen', '1'); w.remove();
          if (b.dataset.w === 'tour') tourStart();
          else if (b.dataset.w !== 'skip') location.hash = b.dataset.w;
        });
      });
      w.addEventListener('click', function (e) { // backdrop tap dismisses
        if (e.target === w) { localStorage.setItem('foodlink-seen', '1'); w.remove(); }
      });
    }
    // tour bar
    var old = document.querySelector('.tourbar'); if (old) old.remove();
    if (store.tour.active) {
      var tb = document.createElement('div'); tb.innerHTML = tourBarHTML();
      var bar = tb.firstChild; document.body.appendChild(bar);
      bar.querySelectorAll('[data-tour]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (b.dataset.tour === 'next') tourNext();
          else { store.tour = { active: false, i: 0 }; bar.remove(); toast('Tour ended — explore freely.'); }
        });
      });
    }
    window.scrollTo(0, 0);
  }

  function bind(name) {
    if (name === 'needs-board') name = 'needsBoard'; // alias: tab href vs handler key
    var app = document.getElementById('app');

    if (name === 'home') {
      var tl = app.querySelector('[data-tour-start]');
      if (tl) tl.addEventListener('click', tourStart);
    }

    if (name === 'donate') {
      var txt = document.getElementById('postText'), find = document.getElementById('findMatch');
      var check = document.getElementById('attest'), out = document.getElementById('parseOut');
      var doffer = document.getElementById('directOffer');
      if (store.tour.active && TOUR[store.tour.i] && TOUR[store.tour.i].prefill && !txt.value) {
        txt.value = EXAMPLE; check.checked = true;
        store.draft = AI.parseDonation(EXAMPLE); store.draft.attested = true;
        out.innerHTML = parseHTML(store.draft);
      }
      function refresh() { find.disabled = !(txt.value.trim().length > 4 && check.checked); }
      var deb;
      txt.addEventListener('input', function () {
        refresh(); clearTimeout(deb);
        var v = txt.value;
        deb = setTimeout(function () {
          if (v.trim().length < 6) { out.innerHTML = ''; return; }
          var base = AI.parseDonation(v);
          store.draft = base; out.innerHTML = parseHTML(base);
          AI.parseDonationSmart(v).then(function (p) {
            if (txt.value === v) { store.draft = p; out.innerHTML = parseHTML(p); }
          });
        }, 350);
      });
      check.addEventListener('change', refresh);
      find.addEventListener('click', function () {
        if (store.draft) { store.draft.raw = txt.value; store.draft.directOffer = doffer.checked; }
        location.hash = '#match';
      });
    }

    if (name === 'match') {
      app.querySelectorAll('[data-connect]').forEach(function (b) {
        b.addEventListener('click', function () {
          var d = store.draft, org = D.orgs.concat([directHouseholdOrg(d)])
            .find(function (o) { return o.id === b.dataset.connect; });
          d.directDone = !!org.direct;
          store.impact.meals += d.qty; store.impact.donations += 1;
          if (store.impact.orgs.indexOf(org.name) === -1) store.impact.orgs.push(org.name);
          saveImpact();
          var listing = store.listings.find(function (l) { return l.claimedBy === null && l.type === d.type; });
          if (listing) listing.claimedBy = org.name;
          publish();
          toast('✓ ' + org.name + ' accepted — ' + d.qty + ' meals rescued');
          location.hash = '#receipt';
        });
      });
    }

    if (name === 'need') {
      app.querySelectorAll('[data-lang]').forEach(function (b) {
        b.addEventListener('click', function () { I.set(b.dataset.lang); render(); });
      });
      app.querySelectorAll('[data-filter]').forEach(function (b) {
        b.addEventListener('click', function () { store.filter = b.dataset.filter; render(); });
      });
      app.querySelectorAll('[data-expand]').forEach(function (c) {
        c.addEventListener('click', function () {
          store.openCard = store.openCard === c.dataset.expand ? null : c.dataset.expand; render();
        });
      });
      var s = document.getElementById('searchFood');
      if (s) { var deb2; s.addEventListener('input', function () {
        clearTimeout(deb2); var v = s.value; deb2 = setTimeout(function () { store.query = v; render();
          var s2 = document.getElementById('searchFood'); if (s2) { s2.focus(); s2.setSelectionRange(v.length, v.length); }
        }, 250); });
      }
    }

    if (name === 'settings') {
      var prov = document.getElementById('aiProvider');
      prov.addEventListener('change', function () {
        document.getElementById('aiKeyRow').style.display =
          (prov.value === 'template' || prov.value === 'ollama') ? 'none' : '';
        document.getElementById('aiModel').placeholder = AI.DEFAULTS[prov.value].model || '';
      });
      document.getElementById('aiSave').addEventListener('click', function () {
        var cfg = { provider: prov.value, key: document.getElementById('aiKey').value.trim(),
                    model: document.getElementById('aiModel').value.trim() };
        AI.setConfig(cfg);
        var st = document.getElementById('aiStatus');
        st.innerHTML = 'Testing connection…';
        AI.testConnection().then(function (r) {
          st.innerHTML = r.ok
            ? '<b style="color:var(--green-700)">✓ Connected — AI replied: “' + esc(r.reply) + '”</b>'
            : '<b style="color:var(--red-600)">✗ ' + esc(r.error) + '</b> — falling back to templates; demo still works.';
        });
      });
    }

    if (name === 'sms') {
      var input = document.getElementById('chatInput'), send = document.getElementById('chatSend');
      function sendMsg(text) {
        text = (text || input.value).trim();
        if (!text || store.chatBusy) return;
        store.chat.push({ me: true, t: text });
        store.chatBusy = true; render();
        AI.assistantReply(store.chat.map(function (m) {
          return { role: m.me ? 'user' : 'assistant', content: m.t };
        }), snapshot()).then(function (t) {
          store.chat.push({ me: false, t: t.trim() });
        }).catch(function () {
          var canned = AI.smsScript(I.get());
          store.chat.push({ me: false, t: '(offline mode) ' + canned[1].t +
            ' — add a free AI key in ⚙️ for live answers.' });
        }).finally(function () { store.chatBusy = false; render(); });
      }
      send.addEventListener('click', function () { sendMsg(); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(); });
      app.querySelectorAll('[data-say]').forEach(function (b) {
        b.addEventListener('click', function () { sendMsg(b.dataset.say); });
      });
      var thread = document.getElementById('chatThread');
      if (thread) thread.scrollTop = thread.scrollHeight;
    }

    if (name === 'needsBoard') {
      var btn = document.getElementById('postNeed');
      btn.addEventListener('click', function () {
        var v = document.getElementById('needText').value.trim();
        if (v.length < 6) { toast('Tell us a little more about the need.'); return; }
        AI.parseDonationSmart(v).then(function (p) {
          store.needs.unshift({ id: 'N' + Date.now(), org: 'Your organization (simulated)', type: p.type,
            qty: p.qty, label: v, by: p.deadlineLabel, note: '' });
          publish();
          render(); toast('Posted to the Needs Board ✓');
        });
      });
      var ex = document.getElementById('exportData');
      ex.addEventListener('click', function () {
        var blob = new Blob([JSON.stringify({
          generated: new Date().toISOString(), region: 'Greater Des Moines (simulated demo)',
          weights: E.WEIGHTS, impact: store.impact,
          listings: store.listings, needs: store.needs
        }, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'foodlink-network-data.json'; a.click();
        toast('Network data exported ✓');
      });
    }
  }

  window.addEventListener('hashchange', render);
  render();
})();
