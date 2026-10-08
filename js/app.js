/* FoodLink app — hash-routed views. Classic script; globals: Engine, Data, AI, I18N. */
(function () {
  'use strict';
  var E = window.FoodLinkEngine, D = window.FoodLinkData, AI = window.FoodLinkAI, I = window.FoodLinkI18N;

  var store = {
    listings: JSON.parse(JSON.stringify(D.listings)),
    needs: JSON.parse(JSON.stringify(D.needs)),
    impact: JSON.parse(localStorage.getItem('foodlink-impact') || '{"meals":0,"donations":0,"orgs":[]}'),
    draft: null, lang: 'en', filter: 'all'
  };
  function saveImpact() { localStorage.setItem('foodlink-impact', JSON.stringify(store.impact)); }
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

  /* ---------------- views ---------------- */
  var views = {};

  views.home = function () {
    var live = store.listings.filter(function (l) { return !l.claimedBy; }).length;
    var claimed = store.listings.filter(function (l) { return l.claimedBy; }).length;
    return '' +
    '<div class="brand"><div class="logo">🌽</div><div><b>FoodLink</b>' +
    '<small>The real-time food grid · Des Moines</small></div></div>' +
    '<span class="tag"><i></i>' + (live + claimed) + ' listings on the board right now</span>' +
    '<a class="btn-big btn-need" href="#need">🍅 I need food<span>Free food near you, today — no sign-up</span></a>' +
    '<a class="btn-big btn-have" href="#donate">🏪 I have food<span>Businesses &amp; organizations: post surplus in one sentence</span></a>' +
    '<div class="lane">📱 <div><b>No smartphone? No problem.</b> Text <b>FOOD</b> to FoodLink — works on any phone, ' +
    '<a href="#sms">see the live demo (' + (I.get() === 'es' ? 'en Español' : 'en Español too') + ')</a>.</div></div>' +
    '<div class="gridmini"><h4>The Grid — live</h4>' + gridHTML() +
    '<div class="legend"><span><i style="background:var(--blue-600)"></i>surplus</span>' +
    '<span><i style="background:var(--red-600)"></i>need</span>' +
    '<span style="margin-left:auto">a closed circuit = food rescued</span></div></div>' +
    '<div class="gridmini"><h4>Your impact so far (this device)</h4><div class="card" style="margin:0">' +
    '<div class="meta" style="font-size:14px"><b style="font-size:22px;color:var(--green-700)">' + store.impact.meals +
    '</b> meals rescued · ' + store.impact.donations + (store.impact.donations === 1 ? ' donation' : ' donations') + ' · ' +
    E.impact(store.impact.meals).lbs + ' lbs diverted · $' + E.impact(store.impact.meals).value + ' in value</div></div></div>' +
    '<p class="footnote">All organizations and listings are simulated for this demo — no real partnership is claimed.<br>' +
    'Matching math: hard safety gates, then urgency .35 · distance .30 · capacity .20 · transport .15.</p>';
  };

  function gridHTML() {
    var pts = [[14, 28, 's'], [24, 42, 'n'], [46, 14, 's'], [72, 62, 's'], [56, 76, 'n']];
    var dx = (pts[1][0] - pts[0][0]) / 100 * 380, dy = (pts[1][1] - pts[0][1]) / 100 * 88;
    var line = '<div class="link-line" style="left:' + pts[0][0] + '%;top:' + pts[0][1] +
      '%;width:' + Math.sqrt(dx * dx + dy * dy).toFixed(0) + 'px;transform:rotate(' +
      (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + 'deg)"></div>';
    var dots = pts.map(function (p) {
      return '<div class="dot ' + p[2] + '" style="left:' + p[0] + '%;top:' + p[1] + '%"></div>';
    }).join('');
    return '<div class="dots">' + line + dots + '</div>';
  }

  views.donate = function () {
    var d = store.draft;
    return '' +
    '<a class="back" href="#home">← Home</a>' +
    '<h3 class="sec">Post surplus</h3>' +
    '<p class="sub">Type it like you\'d text a coworker. FoodLink does the rest.</p>' +
    '<textarea class="post" id="postText" placeholder="e.g. 40 vegetarian prepared meals, refrigerated, need gone by 7pm">' +
    esc(d ? d.raw : '') + '</textarea>' +
    '<div id="parseOut">' + (d ? parseHTML(d) : '') + '</div>' +
    '<label class="check"><input type="checkbox" id="attest"> I attest this food has been held at safe temperatures ' +
    'and will be labeled for allergens.</label>' +
    '<button class="btn btn-primary" id="findMatch" disabled>Find where it should go →</button>' +
    '<p class="ai-note">Parsed by FoodLink\'s assistant (template parser — works offline; an LLM hook can be enabled).</p>';
  };

  function parseHTML(d) {
    return '<div class="parsed"><b>✓ FoodLink parsed your note</b>' +
      '<span class="chip">🍱 ' + esc(E.labelType(d.type)) + '</span>' +
      '<span class="chip">× ' + d.qty + '</span>' +
      '<span class="chip">' + (d.storage === 'refrigerated' ? '❄️' : d.storage === 'frozen' ? '🧊' : '📦') + ' ' + d.storage + '</span>' +
      (d.diet ? '<span class="chip">🌱 ' + d.diet + '</span>' : '') +
      '<span class="chip">⏰ ' + esc(d.deadlineLabel) + '</span></div>';
  }

  views.match = function (id) {
    var d = store.draft;
    if (!d) { location.hash = '#donate'; return ''; }
    var ranked = E.rank(D.orgs, d);
    var best = ranked.filter(function (r) { return !r.gated; })[0];
    var rival = ranked.filter(function (r) { return !r.gated; })[1];
    if (best) best.vsRivalP = rival ? E.monteCarlo(best.factors, rival.factors, 20000) : 1;
    var out = '<a class="back" href="#donate">← Edit post</a>' +
      '<h3 class="sec">Where your ' + d.qty + ' ' + esc(E.labelType(d.type)).replace(/s$/, '') + (d.qty > 1 ? 's' : '') + ' should go</h3>' +
      '<p class="sub">Ranked by the match score — math shown, nothing hidden.</p>';
    ranked.forEach(function (m, i) {
      if (m.gated) {
        out += '<div class="match gated"><div class="head"><b>' + esc(m.org.name) + '</b><span class="score">—</span></div>' +
          '<div class="meta">📍 ' + m.org.miles + ' mi · ' + esc(m.org.hours) + '</div>' +
          m.reasons.map(function (r) { return '<span class="tag-gate">✕ GATED — ' + esc(r) + '</span>'; }).join(' ') + '</div>';
        return;
      }
      var f = m.factors, top = i === 0;
      out += '<div class="match' + (top ? ' top' : '') + '"><div class="head"><b>' + esc(m.org.name) + '</b>' +
        '<span class="score">' + (m.score * 100).toFixed(1) + '<small>%</small></span></div>' +
        '<div class="meta">📍 ' + m.org.miles + ' mi · ' + (f.capacity >= 1 ? 'can take all ' + d.qty : 'can take ' + m.org.capacityMax + ' of ' + d.qty) +
        ' · ' + esc(m.org.hours) + '</div>' +
        '<div class="bars">' + bar('urgency .35', f.urgency) + bar('distance .30', f.distance) +
        bar('capacity .20', f.capacity) + bar('transport .15', f.transport) + '</div>' +
        '<div class="why">“' + esc(AI.explainMatch(m, d)) + '”</div>' +
        (top ? '<button class="btn btn-primary" data-connect="' + m.org.id + '">Connect →</button>' : '') +
        '</div>';
    });
    out += '<p class="footnote">Weights are visible on every bar. Robustness tested by simulation: the top ranking holds in ~' +
      (best ? Math.round(best.vsRivalP * 100) : 100) + '% of random weightings.</p>';
    return out;
  };

  function bar(label, v) {
    return '<div class="bar"><span>' + label + '</span><div class="track"><div class="fill" style="width:' +
      Math.round(v * 100) + '%"></div></div><span>' + v.toFixed(2) + '</span></div>';
  }

  views.receipt = function (id) {
    var d = store.draft;
    if (!d) { location.hash = '#home'; return ''; }
    var imp = E.impact(d.qty), tax = E.taxEstimate(d.qty), yr = E.taxEstimate(d.qty * 52);
    return '' +
    '<a class="back" href="#home">← Home</a>' +
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
    '<div class="row"><span>Potential tax deduction (est.)</span><b>$' + tax.deduction.toFixed(2) + '</b></div>' +
    '<div class="row"><span>This pattern, all year →</span><b>$' + yr.deduction.toFixed(2) + '</b></div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="window.print()">⬇ Save / print receipt</button>' +
    '<p class="tax-note">Estimates only — IRC §170(e)(3): basis + ½ of expected gain, capped at 2× basis ' +
    '(25%-of-FMV basis election assumed). Not tax advice.</p>' +
    '<a class="btn btn-ghost" href="#need">See what households see →</a>';
  };

  views.need = function () {
    var cards = store.listings.filter(function (l) {
      if (store.filter === 'today' && l.deadlineMin > 1440) return false;
      if (store.filter === 'veg' && l.diet !== 'vegetarian') return false;
      return true;
    }).map(function (l) {
      var org = D.orgs.find(function (o) { return o.name === l.distribution.org; });
      var mi = org ? org.miles : 1.4;
      var es = I.get() === 'es';
      var lbl = l.deadlineMin <= 1440 ? I.t('today') + ' · ' + I.t('until') + ' ' + fmtTime(l.deadlineMin) : I.t('sat');
      var win = es ? (l.distribution.windowEs || l.distribution.window) : l.distribution.window;
      var note = es ? (l.distribution.noteEs || l.distribution.note) : l.distribution.note;
      return '<div class="card"><span class="pill ' + (l.deadlineMin <= 1440 ? 'now' : 'ok') + '">' + lbl + '</span>' +
        '<div class="k">' + I.t(l.type) + '</div><h5>' + l.qty + ' ' + I.t(l.type) +
        (l.diet ? ' · ' + I.diet(l.diet) : '') + '</h5>' +
        '<div class="meta">📍 ' + mi + ' mi · ' + I.t('via') + ' ' + esc(l.distribution.org) + '</div>' +
        '<div class="honest">' + I.t('dist') + ': ' + esc(win) + (note ? ' · ' + esc(note) : '') + ' · <b>' + I.t('confirmed') + '</b></div></div>';
    }).join('');
    return '' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
    '<div class="seg"><button data-lang="en" class="' + (I.get() === 'en' ? 'on' : '') + '">English</button>' +
    '<button data-lang="es" class="' + (I.get() === 'es' ? 'on' : '') + '">Español</button></div>' +
    '<a class="back" style="margin:0" href="#sms">📱 Any-phone lane</a></div>' +
    '<h3 class="sec">' + I.t('title') + '</h3><p class="sub">' + I.t('sub') + '</p>' +
    '<div class="filters">' + ['all', 'today', 'veg'].map(function (f) {
      return '<button data-filter="' + f + '" class="' + (store.filter === f ? 'on' : '') + '">' +
        I.t(f === 'all' ? 'all' : f === 'today' ? 'filterToday' : 'filterVeg') + '</button>';
    }).join('') + '</div>' +
    (cards || '<div class="card"><div class="meta">Nothing right now — check the SMS lane or check back soon.</div></div>') +
    '<p class="footnote">' + I.t('expiry') + '</p>';
  };

  views.sms = function () {
    var s = AI.smsScript(I.get());
    return '' +
    '<a class="back" href="#need">← ' + I.t('title') + '</a>' +
    '<h3 class="sec">📱 ' + I.t('smsTitle') + '</h3><p class="sub">' + I.t('smsSub') + '</p>' +
    '<div class="sms-thread">' + s.map(function (m) {
      return '<div class="sms' + (m.me ? ' me' : '') + '">' + esc(m.t) + '</div>';
    }).join('') + '</div>' +
    '<p class="footnote">34% of low-income adults are smartphone-only; ~1 in 5 seniors own no smartphone (Pew 2025). ' +
    'SMS works on all of them. NYC\'s Plentiful proved the pattern in 9 languages — FoodLink brings it to Des Moines.</p>';
  };

  views.needsBoard = function () {
    return '' +
    '<a class="back" href="#home">← Home</a>' +
    '<h3 class="sec">Needs Board</h3>' +
    '<p class="sub">The demand side posts too — surplus gets a destination <i>before</i> it\'s cooked.</p>' +
    store.needs.map(function (n) {
      return '<div class="card need"><div class="k">NEED · ' + esc(E.labelType(n.type)) + '</div>' +
        '<h5>' + esc(n.label) + '</h5>' +
        '<div class="meta">' + esc(n.org) + ' · by ' + esc(n.by) + (n.note ? ' · ' + esc(n.note) : '') + '</div></div>';
    }).join('') +
    '<div class="card"><div class="k">Post a need (organizations)</div>' +
    '<input class="txt" id="needText" placeholder="e.g. We need 30 halal meals Friday night" style="margin-top:8px">' +
    '<button class="btn btn-primary" id="postNeed">Post to the board</button></div>';
  };

  /* ---------------- router ---------------- */
  views['needs-board'] = views.needsBoard; // tab href alias
  function render() {
    var h = location.hash.replace('#', '') || 'home';
    var parts = h.split('/'), name = parts[0], arg = parts[1];
    var fn = views[name] || views.home;
    document.getElementById('app').innerHTML = fn(arg);
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      a.classList.toggle('on', a.dataset.tab === name);
    });
    bind(name);
    window.scrollTo(0, 0);
  }

  function bind(name) {
    var app = document.getElementById('app');
    if (name === 'donate') {
      var txt = document.getElementById('postText'), find = document.getElementById('findMatch');
      var check = document.getElementById('attest');
      function refresh() { find.disabled = !(txt.value.trim().length > 4 && check.checked); }
      txt.addEventListener('input', refresh); check.addEventListener('change', refresh);
      find.addEventListener('click', function () {
        store.draft = AI.parseDonation(txt.value); store.draft.attested = check.checked;
        AI.parseDonationSmart(txt.value).then(function (p) { // upgrades if LLM hook configured
          p.attested = check.checked; store.draft = p; location.hash = '#match';
        });
        location.hash = '#match';
      });
    }
    if (name === 'match') {
      app.querySelectorAll('[data-connect]').forEach(function (b) {
        b.addEventListener('click', function () {
          var d = store.draft, org = D.orgs.find(function (o) { return o.id === b.dataset.connect; });
          store.impact.meals += d.qty; store.impact.donations += 1;
          if (store.impact.orgs.indexOf(org.name) === -1) store.impact.orgs.push(org.name);
          saveImpact();
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
    }
    if (name === 'needsBoard') {
      var btn = document.getElementById('postNeed');
      btn.addEventListener('click', function () {
        var v = document.getElementById('needText').value.trim();
        if (v.length < 6) { toast('Tell us a little more about the need.'); return; }
        var p = AI.parseDonation(v);
        store.needs.unshift({ id: 'N' + Date.now(), org: 'Your organization (simulated)', type: p.type,
          qty: p.qty, label: v, by: p.deadlineLabel, note: '' });
        render(); toast('Posted to the Needs Board ✓');
      });
    }
  }

  window.addEventListener('hashchange', render);
  render();
})();
