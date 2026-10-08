/* FoodLink assistant — free/open-source AI layer with a guaranteed offline fallback.
   Providers: Ollama (local, open-source models), Groq, Google Gemini, OpenRouter (free tiers).
   If no provider is configured or reachable, every feature still works via templates. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoodLinkAI = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    template: { label: 'Template parser (offline)', model: '' },
    ollama:   { label: 'Ollama (local, open-source)', model: 'llama3.2', base: 'http://localhost:11434' },
    groq:     { label: 'Groq (free tier)', model: 'llama-3.1-8b-instant', base: 'https://api.groq.com/openai/v1' },
    gemini:   { label: 'Google Gemini (free tier)', model: 'gemini-2.0-flash', base: 'https://generativelanguage.googleapis.com/v1beta' },
    openrouter: { label: 'OpenRouter (free models)', model: 'meta-llama/llama-3.2-3b-instruct:free', base: 'https://openrouter.ai/api/v1' }
  };

  function getConfig() {
    try { return Object.assign({ provider: 'template', key: '', model: '' },
      JSON.parse(localStorage.getItem('foodlink-ai') || '{}')); }
    catch (e) { return { provider: 'template', key: '', model: '' }; }
  }
  function setConfig(cfg) { localStorage.setItem('foodlink-ai', JSON.stringify(cfg)); }
  function activeModel() {
    var c = getConfig(), d = DEFAULTS[c.provider] || DEFAULTS.template;
    return { provider: c.provider, label: d.label, model: c.model || d.model,
             live: c.provider !== 'template' };
  }

  /* ---------- one unified chat() ---------- */
  function chat(messages, opts) {
    opts = opts || {};
    var c = getConfig();
    if (c.provider === 'template') return Promise.reject(new Error('no-ai'));
    var d = DEFAULTS[c.provider] || {};
    var model = c.model || d.model;
    if (c.provider === 'ollama') {
      return fetch(d.base + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: messages, stream: false })
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.message || !j.message.content) throw new Error('ollama: bad response');
        return j.message.content;
      });
    }
    if (c.provider === 'gemini') {
      var sys = messages.filter(function (m) { return m.role === 'system'; })
        .map(function (m) { return m.content; }).join('\n');
      var contents = messages.filter(function (m) { return m.role !== 'system'; })
        .map(function (m) { return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }; });
      return fetch(d.base + '/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(c.key), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contents, systemInstruction: sys ? { parts: [{ text: sys }] } : undefined,
          generationConfig: { maxOutputTokens: opts.maxTokens || 300 } })
      }).then(function (r) { return r.json(); }).then(function (j) {
        var t = j.candidates && j.candidates[0] && j.candidates[0].content &&
                j.candidates[0].content.parts && j.candidates[0].content.parts[0].text;
        if (!t) throw new Error('gemini: ' + ((j.error && j.error.message) || 'bad response'));
        return t;
      });
    }
    // OpenAI-compatible: groq, openrouter
    var headers = { 'Content-Type': 'application/json' };
    if (c.key) headers.Authorization = 'Bearer ' + c.key;
    if (c.provider === 'openrouter') headers['X-Title'] = 'FoodLink';
    return fetch(d.base + '/chat/completions', {
      method: 'POST', headers: headers,
      body: JSON.stringify({ model: model, messages: messages, max_tokens: opts.maxTokens || 300, temperature: 0.3 })
    }).then(function (r) { return r.json(); }).then(function (j) {
      var t = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!t) throw new Error(c.provider + ': ' + ((j.error && j.error.message) || 'bad response'));
      return t;
    });
  }

  function testConnection() {
    return chat([{ role: 'user', content: 'Reply with exactly: OK' }], { maxTokens: 10 })
      .then(function (t) { return { ok: true, reply: String(t).trim().slice(0, 40) }; })
      .catch(function (e) { return { ok: false, error: String(e.message || e) }; });
  }

  /* ---------- tolerant JSON extraction ---------- */
  function extractJSON(text) {
    var m = String(text).match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no json');
    return JSON.parse(m[0]);
  }

  /* ---------- 1. donation parser (template fallback, always available) ---------- */
  var TYPES = [
    [/(prepared\s*meal|hot\s*meal|meal|entree|wrap|pizza|soup)/i, 'prepared'],
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
    var out = { raw: text.trim(), type: null, qty: null, diet: '', storage: 'ambient', deadlineMin: 180, deadlineLabel: 'in ~3 hours', via: 'template' };
    var i, m;
    for (i = 0; i < TYPES.length; i++) if (TYPES[i][0].test(text)) { out.type = TYPES[i][1]; break; }
    m = text.match(/(\d{1,4})\s*(?:x|lbs|pounds|meals|servings|boxes|bags|units)?/i);
    if (m) out.qty = parseInt(m[1], 10);
    for (i = 0; i < DIETS.length; i++) if (DIETS[i][0].test(text)) { out.diet = DIETS[i][1]; break; }
    for (i = 0; i < STORAGE.length; i++) if (STORAGE[i][0].test(text)) { out.storage = STORAGE[i][1]; break; }
    if (/shelf[- ]?stable|canned|boxed/i.test(text)) out.storage = 'ambient';
    m = text.match(/by\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (m) {
      var h = parseInt(m[1], 10) % 12, min = m[2] ? parseInt(m[2], 10) : 0;
      var target = new Date();
      target.setHours((m[3] ? (m[3].toLowerCase() === 'pm' ? h + 12 : h) : (parseInt(m[1], 10) <= 7 ? h + 12 : h)), min, 0, 0);
      out.deadlineMin = Math.max(15, Math.round((target - Date.now()) / 60000));
      out.deadlineLabel = 'by ' + m[1] + (m[2] ? ':' + m[2] : '') + ' ' + (m[3] || 'PM').toUpperCase();
    } else if (/tonight/i.test(text)) { out.deadlineMin = 240; out.deadlineLabel = 'tonight'; }
    else if (/tomorrow/i.test(text)) { out.deadlineMin = 1380; out.deadlineLabel = 'tomorrow'; }
    if (out.type === 'shelf-stable') out.storage = 'ambient';
    if (!out.type) out.type = 'prepared';
    if (!out.qty) out.qty = 20;
    return out;
  }

  var TYPE_ENUM = ['prepared', 'produce', 'bakery', 'dairy', 'shelf-stable', 'frozen'];
  function parseDonationSmart(text) {
    var fallback = parseDonation(text);
    var P = (typeof root !== 'undefined' && root.FoodLinkPrompts) || null;
    var system = P ? P.PARSE_SYSTEM :
      'Extract JSON {type: prepared|produce|bakery|dairy|shelf-stable|frozen, qty: number, diet: string, ' +
      'storage: refrigerated|frozen|hot|ambient, deadlineMinFromNow: number}. Reply with ONLY the JSON.';
    return chat([
      { role: 'system', content: system },
      { role: 'user', content: text }
    ], { maxTokens: 120 }).then(function (t) {
      var p = extractJSON(t), out = Object.assign({}, fallback);
      if (TYPE_ENUM.indexOf(p.type) !== -1) out.type = p.type;
      if (typeof p.qty === 'number' && p.qty > 0 && p.qty < 100000) out.qty = Math.round(p.qty);
      if (typeof p.diet === 'string') out.diet = p.diet;
      if (['refrigerated', 'frozen', 'hot', 'ambient'].indexOf(p.storage) !== -1) out.storage = p.storage;
      if (typeof p.deadlineMinFromNow === 'number' && p.deadlineMinFromNow > 5) {
        out.deadlineMin = Math.round(p.deadlineMinFromNow);
        out.deadlineLabel = 'in ~' + (out.deadlineMin >= 90 ? Math.round(out.deadlineMin / 60) + 'h' : out.deadlineMin + ' min');
      }
      out.via = activeModel().provider + ':' + activeModel().model;
      return out;
    }).catch(function () { return fallback; });
  }

  /* ---------- 2. explainable "why" (engine-computed, offline-safe) ---------- */
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

  /* ---------- 3. live conversational assistant (the any-phone brain) ---------- */
  function systemPrompt(snapshot) {
    var P = (typeof root !== 'undefined' && root.FoodLinkPrompts) || null;
    if (P && P.assistantSystem) return P.assistantSystem(snapshot);
    return 'You are FoodLink\'s text assistant for Greater Des Moines food access. ' +
      'Rules: reply in the SAME LANGUAGE the person writes in; keep replies under 45 words, SMS-style, warm, no jargon. ' +
      'Never guarantee food or promise eligibility; pantries use self-attestation. Point people to the distribution windows listed. ' +
      'If asked about surplus/donation, explain businesses can post in one sentence at FoodLink. ' +
      'LIVE INVENTORY (JSON): ' + JSON.stringify(snapshot);
  }
  function assistantReply(history, snapshot) {
    return chat([{ role: 'system', content: systemPrompt(snapshot) }].concat(history), { maxTokens: 200 });
  }

  /* AI rephrases the engine's match explanation — numbers stay engine-computed. */
  function explainTopAI(match, donation) {
    var P = (typeof root !== 'undefined' && root.FoodLinkPrompts);
    if (!P) return Promise.reject(new Error('no-prompts'));
    return chat([
      { role: 'system', content: P.EXPLAIN_SYSTEM },
      { role: 'user', content: P.explainUser(match, donation) }
    ], { maxTokens: 80 }).then(function (t) {
      var s = String(t).trim().replace(/^["“]+|["”]+$/g, '');
      if (s.length < 10 || s.length > 200) throw new Error('bad explain');
      return s;
    });
  }

  /* ---------- canned fallback script (offline demo mode) ---------- */
  function smsScript(lang) {
    if (lang === 'es') return [
      { me: true, t: 'necesito comida para hoy' },
      { me: false, t: '¡Claro! Hoy cerca de ti: 40 comidas vegetarianas — despensa socio de DMARC, 2.3 mi, distribución 4–7 PM, sin cita. ¿Te sirven?' }
    ];
    return [
      { me: true, t: 'I need food today' },
      { me: false, t: 'Right now: 40 vegetarian meals via Eastside Community Pantry, 2.3 mi, distribution 4–7 PM, no appointment. Also 30 bakery items until 8 PM. Which works?' }
    ];
  }

  return {
    DEFAULTS: DEFAULTS, getConfig: getConfig, setConfig: setConfig, activeModel: activeModel,
    chat: chat, testConnection: testConnection, extractJSON: extractJSON,
    parseDonation: parseDonation, parseDonationSmart: parseDonationSmart,
    explainMatch: explainMatch, assistantReply: assistantReply, explainTopAI: explainTopAI,
    smsScript: smsScript, labelType: labelType
  };
});
