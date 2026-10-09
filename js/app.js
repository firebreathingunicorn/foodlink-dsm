/* Xenia site — one page, three sections. Classic script; globals: Engine, Data, AI (template parser only), Icons. */
(function () {
  'use strict';
  var E = window.FoodLinkEngine, D = window.FoodLinkData, AI = window.FoodLinkAI, ic = window.FoodLinkIcons;
  var EXAMPLE = '40 vegetarian prepared meals, refrigerated, need gone by 7pm';
  var TYPE_IC = { prepared: 'plate', produce: 'leaf', bakery: 'grain', dairy: 'cold', 'shelf-stable': 'box', frozen: 'cold' };

  var store = {
    listings: JSON.parse(JSON.stringify(D.listings)),
    needs: JSON.parse(JSON.stringify(D.needs)),
    jobs: [
      { id: 'J1', label: 'Sort and bag produce', org: 'Mobile Pantry — South Side', when: 'Saturday 9–11 AM', want: 4, have: 1 },
      { id: 'J2', label: 'Neighborhood clean-up, then a community meal', org: 'City parks crew', when: 'Sunday 10 AM · everyone eats, whether they work or not', want: 12, have: 5 },
      { id: 'J3', label: 'Unload the weekly delivery truck', org: 'Johnston Community Pantry', when: 'Thursday 3 PM · about an hour', want: 3, have: 2 }
    ],
    draft: null, photo: null
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- two windows stay in step (same browser) ---------- */
  var bc = null;
  try { bc = new BroadcastChannel('foodlink-grid'); } catch (e) { /* older browsers */ }
  if (bc) bc.onmessage = function (e) {
    var m = e.data;
    if (!m || m.type !== 'sync') return;
    store.listings = m.listings; store.needs = m.needs; if (m.jobs) store.jobs = m.jobs;
    renderListings(); renderNeeds(); renderJobs();
  };
  function publish() { if (bc) bc.postMessage({ type: 'sync', listings: store.listings, needs: store.needs, jobs: store.jobs }); }

  /* ---------- find food ---------- */
  function renderListings() {
    $('listings').innerHTML = store.listings.map(function (l) {
      var d = l.distribution;
      return '<article class="card' + (l.fresh ? ' fresh' : '') + '">' +
        (l.photo ? '<img class="cardphoto" src="' + esc(l.photo) + '" alt="Photo of the food">' : '') +
        (l.fresh ? '<span class="tag new">just posted</span>' : '') +
        '<h4>' + l.qty + ' ' + esc(E.labelType(l.type)) + (l.diet ? ', ' + esc(l.diet) : '') + '</h4>' +
        '<p class="where">' + ic('pin') + ' Pick up at <b>' + esc(d.org) + '</b></p>' +
        '<p class="when">' + ic('clock') + ' ' + esc(cap(d.window)) + (d.note ? ' · ' + esc(d.note) : '') + '</p>' +
        '<p class="from">Given by ' + esc(l.donor.replace(' (simulated)', '')) + '</p></article>';
    }).join('');
  }

  var here = null; // the visitor's position, only if they ask for "closest to me"
  function milesTo(r) {
    if (!here || r.lat == null) return null;
    var k = Math.PI / 180, a = Math.sin((r.lat - here.lat) * k / 2), b = Math.sin((r.lng - here.lng) * k / 2);
    return 7918 * Math.asin(Math.sqrt(a * a + Math.cos(here.lat * k) * Math.cos(r.lat * k) * b * b));
  }
  function renderDirectory() {
    var list = D.directory.slice();
    if (here) list.sort(function (x, y) { // helplines without an address stay on top
      var a = milesTo(x), b = milesTo(y); return (a == null ? -1 : a) - (b == null ? -1 : b); });
    $('directory').innerHTML = list.map(function (r) {
      var mi = milesTo(r);
      var first = r.phone.split('·')[0].trim(), digits = first.replace(/[^0-9+]/g, '');
      var call = digits.length >= 3 ? '<a class="btn solid sm" href="tel:' + digits + '">' + ic('phone') + ' Call ' + esc(first) + '</a>' : '';
      var map = /\d/.test(r.addr) ? '<a class="btn line sm" target="_blank" rel="noopener" href="https://maps.apple.com/?q=' +
        encodeURIComponent(r.name.split(' (')[0] + ', ' + r.addr + ', IA') + '">' + ic('pin') + ' Directions</a>' : '';
      return '<article class="card"><h4>' + esc(r.name) + '</h4>' +
        '<p class="where">' + ic('pin') + ' ' + esc(r.addr) + (mi != null && /\d/.test(r.addr) ? ' · <b>' + mi.toFixed(1) + ' mi from you</b>' : '') + '</p>' +
        '<p class="when">' + ic('clock') + ' ' + esc(r.hours) + '</p>' +
        '<div class="acts">' + call + map + '<a class="src" href="' + r.src + '" target="_blank" rel="noopener">' +
        (call ? 'website' : 'See website') + '</a></div></article>';
    }).join('');
    $('lnkDmarc').href = D.meta.links.dmarcPantries; $('lnkFbi').href = D.meta.links.fbiFindFood;
  }

  /* ---------- what pantries need ---------- */
  function renderNeeds() {
    $('needList').innerHTML = store.needs.map(function (n) {
      return '<article class="card need' + (n.fresh ? ' fresh' : '') + '">' +
        (n.fresh ? '<span class="tag new">just posted</span>' : '') +
        '<h4>' + esc(n.label) + '</h4>' +
        '<p class="where">' + ic('building') + ' ' + esc(n.org) + '</p>' +
        '<p class="when">' + ic('clock') + ' Needed ' + esc(/^(in|by|this|ongoing|tonight|tomorrow)/.test(n.by) ? n.by : 'by ' + n.by) +
        (n.note ? ' · ' + esc(n.note) : '') + '</p>' +
        (n.filled ? '<div class="prog"><div class="track"><div class="fill" style="width:' + Math.min(100, Math.round(n.filled / n.qty * 100)) +
          '%"></div></div><span>' + (n.filled >= n.qty ? 'Covered' : n.filled + ' of ' + n.qty + ' covered') + '</span></div>' : '') +
        '</article>';
    }).join('');
  }
  function needFor(org, d) { // an open request from this pantry for this kind of food
    return store.needs.find(function (n) { return n.org === org.name && n.type === d.type && (n.filled || 0) < n.qty; });
  }

  /* ---------- give time ---------- */
  function renderJobs() {
    $('jobList').innerHTML = store.jobs.map(function (j) {
      var full = j.have >= j.want;
      return '<article class="card' + (j.fresh ? ' fresh' : '') + '">' +
        (j.fresh ? '<span class="tag new">just posted</span>' : '') +
        '<h4>' + esc(j.label) + '</h4>' +
        '<p class="where">' + ic('building') + ' ' + esc(j.org) + '</p>' +
        '<p class="when">' + ic('clock') + ' ' + esc(j.when) + '</p>' +
        '<div class="acts"><button class="btn ' + (j.mine ? 'line' : 'solid') + ' sm" data-job="' + j.id + '"' + (full && !j.mine ? ' disabled' : '') + '>' +
        (j.mine ? ic('check') + ' You\'re in. Tap to cancel' : full ? 'Covered' : 'I can do this') + '</button>' +
        '<span class="src">' + j.have + ' of ' + j.want + (j.want === 1 ? ' person' : ' people') + '</span></div></article>';
    }).join('');
    $('jobList').querySelectorAll('[data-job]').forEach(function (b) {
      b.addEventListener('click', function () {
        var j = store.jobs.find(function (x) { return x.id === b.dataset.job; });
        j.mine = !j.mine; j.have += j.mine ? 1 : -1; publish(); renderJobs();
      });
    });
  }

  /* ---------- give food ---------- */
  function parseHTML(d) {
    return '<div class="parsed"><b>Xenia understood this as</b>' +
      '<span class="chip">' + ic(TYPE_IC[d.type] || 'plate') + ' ' + esc(E.labelType(d.type)) + '</span>' +
      '<span class="chip">' + d.qty + '</span>' +
      '<span class="chip">' + ic('cold') + ' ' + esc(d.storage) + '</span>' +
      (d.diet ? '<span class="chip">' + ic('leaf') + ' ' + esc(d.diet) + '</span>' : '') +
      '<span class="chip">' + ic('clock') + ' ' + esc(d.deadlineLabel) + '</span></div>';
  }
  function bar(label, w, v) {
    return '<div class="bar"><span>' + label + ' <i>×' + w + '</i></span><div class="track"><div class="fill" style="width:' +
      Math.round(v * 100) + '%"></div></div><span>' + v.toFixed(2) + '</span></div>';
  }

  function renderMatch() {
    var d = store.draft, ranked = E.rank(D.orgs.slice(), d);
    var ok = ranked.filter(function (r) { return !r.gated; }), out = ranked.filter(function (r) { return r.gated; });
    var html = '<h3>Where your ' + d.qty + ' ' + esc(E.labelType(d.type)) + ' should go</h3>' +
      '<p class="hint">' + ranked.length + ' places checked · ' + ok.length + ' can take it · ' + out.length + ' ruled out</p>';
    if (!ok.length) html += '<div class="empty"><p>No place in the network can take this before your deadline. Try a later deadline, or call 211.</p></div>';
    ok.forEach(function (m, i) {
      var f = m.factors, top = i === 0, asked = needFor(m.org, d);
      html += '<div class="match' + (top ? ' top' : '') + '"><div class="head"><b>' + (top ? '<span class="tag best">best match</span>' : '') +
        esc(m.org.name) + '</b><span class="score">' + (m.score * 100).toFixed(0) + '<small>%</small></span></div>' +
        '<p class="meta">' + m.org.miles + ' mi away · ' + (f.capacity >= 1 ? 'can take all ' + d.qty : 'can take ' + m.org.capacityMax + ' of ' + d.qty) +
        ' · ' + esc(m.org.hours) + '</p>' +
        (asked ? '<p class="asked">' + ic('megaphone') + ' They asked for this: “' + esc(asked.label) + '”</p>' : '') +
        (top ? '<div class="bars">' + bar('How short they are', '.35', f.urgency) + bar('How close', '.30', f.distance) +
          bar('Room for it', '.20', f.capacity) + bar('Can get it there', '.15', f.transport) + '</div>' +
          '<p class="why">' + esc(AI.explainMatch(m, d)) + '</p>' +
          '<button class="btn solid wide" id="connect" data-org="' + m.org.id + '">Send it to ' + esc(m.org.name) + '</button>' : '') +
        '</div>';
    });
    if (out.length) html += '<h4 class="ruled">Ruled out</h4>' + out.map(function (m) {
      return '<p class="gated"><b>' + esc(m.org.name) + '</b> ' + m.reasons.map(esc).join('; ') + '</p>';
    }).join('');
    $('matchOut').innerHTML = html;
    var c = $('connect');
    if (c) c.addEventListener('click', function () { connect(c.dataset.org); });
    if (window.innerWidth < 860) $('matchOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function connect(orgId) {
    var d = store.draft, org = D.orgs.find(function (o) { return o.id === orgId; });
    var imp = E.impact(d.qty), tax = E.taxEstimate(d.qty), yr = E.taxEstimate(d.qty * 52);
    store.listings.forEach(function (l) { l.fresh = false; });
    store.listings.unshift({ id: 'L' + Date.now(), donor: 'You', type: d.type, qty: d.qty, diet: d.diet, fresh: true, photo: store.photo,
      distribution: { org: org.name, window: org.hours, note: '' } });
    var asked = needFor(org, d), covers = '';
    if (asked) {
      asked.filled = Math.min(asked.qty, (asked.filled || 0) + d.qty);
      covers = '<div class="row"><span>Counts toward their request: “' + esc(asked.label) + '”</span><b>' + asked.filled + ' of ' + asked.qty + '</b></div>';
      renderNeeds();
    }
    store.jobs.forEach(function (j) { j.fresh = false; }); // someone has to carry it there
    store.jobs.unshift({ id: 'J' + Date.now(), label: 'Drive ' + d.qty + ' ' + E.labelType(d.type) + ' to ' + org.name,
      org: 'Xenia donation, ' + org.miles + ' mi trip', when: 'Today · pantry ' + org.hours, want: 1, have: 0, fresh: true });
    renderJobs();
    publish(); renderListings();
    $('matchOut').innerHTML = '<div class="receipt"><p class="eyebrow">Donation receipt</p>' +
      '<p class="big">' + d.qty + ' ' + esc(E.labelType(d.type)) + '</p>' +
      '<p class="meta">Going to ' + esc(org.name) + ' · ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '</p>' +
      covers +
      '<div class="row"><span>Kept out of the dumpster</span><b>' + imp.lbs + ' lbs</b></div>' +
      '<div class="row"><span>Food value ($' + E.IOWA_MEAL_COST + ' a meal, Iowa average)</span><b>' + money(imp.value) + '</b></div>' +
      '<div class="row"><span>Possible tax deduction</span><b>' + money(tax.deduction) + '</b></div>' +
      '<div class="row"><span>If you gave this much every week for a year</span><b>' + money(yr.deduction) + '</b></div></div>' +
      '<div class="cta"><button class="btn line" onclick="window.print()">Print receipt</button>' +
      '<a class="btn solid" href="#find">See it on the board</a></div>' +
      '<p class="hint">A driving job for this donation was added under <a href="#time">Give time</a>.</p>' +
      '<p class="hint">Deduction estimated under IRC §170(e)(3). Ask your accountant.</p>';
  }

  function bindGive() {
    var txt = $('postText'), find = $('findMatch'), check = $('attest'), out = $('parseOut'), deb;
    function refresh() { find.disabled = !(txt.value.trim().length > 5 && check.checked); }
    function parse() {
      var v = txt.value.trim();
      if (v.length < 6) { out.innerHTML = ''; store.draft = null; return; }
      store.draft = AI.parseDonation(v); out.innerHTML = parseHTML(store.draft);
    }
    txt.addEventListener('input', function () { refresh(); clearTimeout(deb); deb = setTimeout(parse, 250); });
    check.addEventListener('change', refresh);
    $('useExample').addEventListener('click', function () { txt.value = EXAMPLE; parse(); refresh(); });
    find.addEventListener('click', function () { parse(); if (store.draft) renderMatch(); });
    $('photo').addEventListener('change', function (e) { // shrink the picture in the browser; it is never uploaded
      var f = e.target.files[0]; if (!f) return;
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, 720 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        store.photo = c.toDataURL('image/jpeg', .8); URL.revokeObjectURL(img.src);
        $('photoPrev').src = store.photo; $('photoPrev').hidden = false; $('photoLabel').textContent = 'Change the photo';
      };
      img.src = URL.createObjectURL(f);
    });
  }

  function bindJobs() {
    $('postJob').addEventListener('click', function () {
      var inp = $('jobText'), v = inp.value.trim();
      if (v.length < 6) { inp.focus(); return; }
      var n = (v.match(/\b(\d+|one|two|three|four|five|six)\b/i) || [])[1];
      n = n ? ({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 }[n.toLowerCase()] || parseInt(n, 10)) : 1;
      store.jobs.forEach(function (j) { j.fresh = false; });
      store.jobs.unshift({ id: 'J' + Date.now(), label: v, org: 'Your organization', when: 'Posted just now', want: Math.min(Math.max(n, 1), 50), have: 0, fresh: true });
      inp.value = ''; publish(); renderJobs();
    });
  }

  function bindNeeds() {
    $('postNeed').addEventListener('click', function () {
      var inp = $('needText'), v = inp.value.trim();
      if (v.length < 6) { inp.focus(); return; }
      var p = AI.parseDonation(v);
      store.needs.forEach(function (n) { n.fresh = false; });
      store.needs.unshift({ id: 'N' + Date.now(), org: 'Your pantry', type: p.type, qty: p.qty, label: v, by: p.deadlineLabel, note: '', fresh: true });
      inp.value = ''; publish(); renderNeeds();
    });
  }

  var map = null, youMark = null;
  function drawMap() {
    if (!window.L) { $('map').style.display = 'none'; return; } // map library didn't load: the list below still works
    map = L.map('map', { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    var pts = [];
    D.directory.forEach(function (r) {
      if (r.lat == null || !/\d/.test(r.addr)) return;
      var digits = r.phone.split('·')[0].replace(/[^0-9+]/g, '');
      pts.push([r.lat, r.lng]);
      L.circleMarker([r.lat, r.lng], { radius: 9, color: '#0c3320', weight: 2, fillColor: '#12613a', fillOpacity: .9 }).addTo(map)
        .bindPopup('<b>' + esc(r.name) + '</b><br>' + esc(r.addr) + '<br>' + esc(r.hours) +
          (digits.length >= 7 ? '<br><a href="tel:' + digits + '">Call ' + esc(r.phone.split('·')[0].trim()) + '</a>' : ''));
    });
    map.fitBounds(pts, { padding: [28, 28] });
  }
  function showYou() {
    if (!map || !here) return;
    if (youMark) youMark.remove();
    youMark = L.circleMarker([here.lat, here.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#b3391f', fillOpacity: 1 })
      .addTo(map).bindPopup('You are here');
  }

  $('nearMe').addEventListener('click', function () {
    var msg = $('nearMsg');
    if (!navigator.geolocation) { msg.textContent = 'Your browser can\'t share a location.'; return; }
    msg.textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(function (p) {
      here = { lat: p.coords.latitude, lng: p.coords.longitude }; msg.textContent = 'Sorted by distance. Your location stays on your device.';
      renderDirectory(); showYou();
    }, function () { msg.textContent = 'Couldn\'t get your location. The list is unchanged.'; });
  });

  document.querySelectorAll('[data-ic]').forEach(function (el) { el.innerHTML = ic(el.dataset.ic); });
  renderListings(); renderDirectory(); drawMap(); renderNeeds(); renderJobs(); bindGive(); bindNeeds(); bindJobs();
})();
