/* FoodLink matching engine — pure functions, loads in browser and Node.
   Hard safety gates first, then an explainable soft score (weights always shown). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoodLinkEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WEIGHTS = { urgency: 0.35, distance: 0.30, capacity: 0.20, transport: 0.15 };
  var DISTANCE_DECAY_MI = 5;      // score = e^(-miles/5)
  var LBS_PER_MEAL = 1.2;         // Feeding America standard conversion
  var IOWA_MEAL_COST = 3.52;      // Map the Meal Gap 2025 (2023 data)
  var BASIS_ELECTION = 0.25;      // small-taxpayer 25%-of-FMV basis election (IRC 170(e)(3))

  function distanceFactor(miles) { return Math.exp(-miles / DISTANCE_DECAY_MI); }
  function capacityFactor(capacity, qty) { return capacity > 0 ? Math.min(capacity / qty, 1) : 0; }

  /* IRC 170(e)(3): basis + 1/2 of (FMV - basis), capped at 2x basis. */
  function enhancedDeduction(fmv, basis) {
    return Math.min(basis + (fmv - basis) / 2, 2 * basis);
  }
  function taxEstimate(meals, opts) {
    opts = opts || {};
    var fmv = meals * IOWA_MEAL_COST;
    var basis = (opts.basis !== undefined) ? opts.basis : fmv * BASIS_ELECTION;
    return { fmv: r2(fmv), basis: r2(basis), deduction: r2(enhancedDeduction(fmv, basis)) };
  }
  function impact(meals) {
    return { meals: meals, lbs: r2(meals * LBS_PER_MEAL), value: r2(meals * IOWA_MEAL_COST) };
  }
  function r2(x) { return Math.round(x * 100) / 100; }

  /* -------- hard gates -------- */
  function gates(org, donation) {
    var failed = [];
    if ((org.accepts || []).indexOf(donation.type) === -1) {
      failed.push('cannot accept ' + labelType(donation.type) + (org.gateNote ? ' (' + org.gateNote + ')' : ''));
    }
    if (donation.storage && org.storage && org.storage.indexOf(donation.storage) === -1) {
      failed.push('no ' + donation.storage + ' storage on site');
    }
    if (typeof donation.deadlineMin === 'number' && typeof org.nextReceiveMin === 'number'
        && org.nextReceiveMin > donation.deadlineMin) {
      failed.push('earliest receiving window is after your deadline');
    }
    if (donation.attested === false) failed.push('safe-handling attestation missing');
    return { ok: failed.length === 0, reasons: failed };
  }

  /* -------- soft score -------- */
  function factors(org, donation) {
    var capacity = capacityFactor(org.capacityMax, donation.qty);
    return {
      urgency: org.needLevel,
      distance: distanceFactor(org.miles),
      capacity: capacity,
      transport: org.transport
    };
  }
  function score(org, donation) {
    var g = gates(org, donation);
    if (!g.ok) return { gated: true, reasons: g.reasons, org: org };
    var f = factors(org, donation);
    var total = WEIGHTS.urgency * f.urgency + WEIGHTS.distance * f.distance
              + WEIGHTS.capacity * f.capacity + WEIGHTS.transport * f.transport;
    return { gated: false, org: org, donation: donation, factors: f, score: r2(total * 100) / 100 };
  }
  function rank(orgs, donation) {
    return orgs.map(function (o) { return score(o, donation); })
      .sort(function (a, b) { return (b.gated ? -1 : b.score) - (a.gated ? -1 : a.score); });
  }

  /* -------- robustness: is the ranking weight-independent? -------- */
  function dominates(a, b) { // a's factors >= b's on every factor, strict on at least one
    var keys = ['urgency', 'distance', 'capacity', 'transport'], strict = false;
    for (var i = 0; i < keys.length; i++) {
      if (!(a[keys[i]] >= b[keys[i]])) return false;
      if (a[keys[i]] > b[keys[i]]) strict = true;
    }
    return strict;
  }
  function monteCarlo(fa, fb, n, seed) { // P(a outranks b) over Dirichlet(1,1,1,1) weights
    n = n || 10000;
    var s = seed || 42, d = [0, 0, 0, 0], keys = ['urgency', 'distance', 'capacity', 'transport'], i, wins = 0;
    for (i = 0; i < 4; i++) d[i] = fa[keys[i]] - fb[keys[i]];
    for (var k = 0; k < n; k++) {
      var e = [0, 0, 0, 0], sum = 0, acc = 0;
      for (i = 0; i < 4; i++) { s = (s * 1103515245 + 12345) % 2147483648; e[i] = -Math.log(1 - s / 2147483648); sum += e[i]; }
      for (i = 0; i < 4; i++) acc += (e[i] / sum) * d[i];
      if (acc > 0) wins++;
    }
    return wins / n;
  }

  function labelType(t) {
    return { prepared: 'prepared meals', produce: 'fresh produce', bakery: 'bakery items',
      dairy: 'dairy', 'shelf-stable': 'shelf-stable items', frozen: 'frozen food' }[t] || t;
  }

  return {
    WEIGHTS: WEIGHTS, DISTANCE_DECAY_MI: DISTANCE_DECAY_MI, LBS_PER_MEAL: LBS_PER_MEAL,
    IOWA_MEAL_COST: IOWA_MEAL_COST,
    distanceFactor: distanceFactor, capacityFactor: capacityFactor,
    gates: gates, factors: factors, score: score, rank: rank,
    dominates: dominates, monteCarlo: monteCarlo,
    enhancedDeduction: enhancedDeduction, taxEstimate: taxEstimate, impact: impact, labelType: labelType
  };
});
