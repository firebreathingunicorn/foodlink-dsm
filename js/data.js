/* FoodLink seed data — ALL ORGANIZATIONS AND LISTINGS ARE SIMULATED FOR THE DEMO.
   Real org names appear only as examples of participant TYPES; no real partnership is claimed.
   Profile numbers (miles, capacity, need level) tuned to the worked example in PLAN-v2 §7. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoodLinkData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // nextReceiveMin: minutes from demo-start until this org can receive (deadline gate demo)
  var orgs = [
    { id: 'dmarc-partner', name: 'Eastside Community Pantry', short: 'DMARC partner pantry',
      miles: 2.3, accepts: ['prepared', 'produce', 'shelf-stable', 'dairy'],
      storage: ['refrigerated', 'ambient'], capacityMax: 60,
      needLevel: 0.90, transport: 0.80, nextReceiveMin: 0,
      hours: 'open till 6 PM',
      serves: 'serves ~120 households/week', languages: ['en', 'es'] },

    { id: 'hope-shelter', name: 'Hope Shelter Kitchen', short: 'Hope shelter kitchen',
      miles: 1.2, accepts: ['prepared', 'shelf-stable'],
      storage: ['refrigerated', 'ambient'], capacityMax: 30,
      needLevel: 0.50, transport: 0.40, nextReceiveMin: 0,
      hours: 'kitchen open now', serves: 'congregate meals nightly' },

    { id: 'polk-produce', name: 'Polk Produce Pantry', short: 'Polk produce pantry',
      miles: 1.0, accepts: ['produce'],
      storage: ['ambient'], capacityMax: 200,
      needLevel: 0.80, transport: 0.60, nextReceiveMin: 0,
      gateNote: 'no reheat capacity', hours: 'open till 5:30 PM' },

    { id: 'urbandale-church', name: 'Urbandale Church Kitchen', short: 'church kitchen',
      miles: 6.0, accepts: ['prepared', 'bakery', 'shelf-stable'],
      storage: ['refrigerated', 'ambient'], capacityMax: 25,
      needLevel: 0.70, transport: 0.60, nextReceiveMin: 0,
      hours: 'open till 8 PM', serves: 'Wednesday community dinner' },

    { id: 'fbi-mobile', name: 'Mobile Pantry — South Side', short: 'mobile pantry',
      miles: 2.1, accepts: ['produce', 'shelf-stable', 'frozen'],
      storage: ['ambient'], capacityMax: 500,
      needLevel: 0.60, transport: 0.90, nextReceiveMin: 1560, // next window Saturday
      hours: 'next distribution Sat 10–11:30 AM' },

    { id: 'johnston-pantry', name: 'Johnston Community Pantry', short: 'Johnston pantry',
      miles: 4.2, accepts: ['produce', 'shelf-stable', 'dairy', 'frozen'],
      storage: ['refrigerated', 'frozen', 'ambient'], capacityMax: 300,
      needLevel: 0.75, transport: 0.50, nextReceiveMin: 0,
      hours: 'open till 7 PM', serves: 'cold storage on site' },

    { id: 'embarc-hub', name: 'EMBARC Community Hub', short: 'community hub',
      miles: 3.5, accepts: ['prepared', 'produce', 'shelf-stable'],
      storage: ['refrigerated', 'ambient'], capacityMax: 40,
      needLevel: 0.85, transport: 0.55, nextReceiveMin: 0,
      hours: 'open till 6:30 PM', languages: ['en', 'es', 'kar'], serves: 'Burmese/Karen community programs' },

    { id: 'vfw-center', name: 'VFW Community Center', short: 'community center',
      miles: 5.1, accepts: ['shelf-stable', 'bakery'],
      storage: ['ambient'], capacityMax: 150,
      needLevel: 0.40, transport: 0.30, nextReceiveMin: 0,
      hours: 'office hours till 5 PM' }
  ];

  // Surplus board. deadlineMin/postedMin are minutes from app load.
  var listings = [
    { id: 'L1', donor: 'Johnston grocery (simulated)', type: 'prepared', qty: 40,
      diet: 'vegetarian', storage: 'refrigerated', deadlineMin: 150, postedMin: -20,
      claimedBy: null, acceptsPartial: false,
      distribution: { org: 'Eastside Community Pantry', window: 'today 4–7 PM', windowEs: 'hoy 4–7 PM', note: 'no appointment needed', noteEs: 'sin cita' } },
    { id: 'L2', donor: 'Downtown grocer (simulated)', type: 'produce', qty: 120,
      diet: '', storage: 'ambient', deadlineMin: 2880, postedMin: -60,
      claimedBy: null,
      distribution: { org: 'Mobile Pantry — South Side', window: 'Saturday 10–11:30 AM', windowEs: 'sábado 10–11:30 AM', note: 'arrive early', noteEs: 'llega temprano' } },
    { id: 'L3', donor: 'Urbandale bakery (simulated)', type: 'bakery', qty: 30,
      diet: '', storage: 'ambient', deadlineMin: 300, postedMin: -45,
      claimedBy: null,
      distribution: { org: 'Urbandale Church Kitchen', window: 'today until 8 PM', windowEs: 'hoy hasta 8 PM', note: 'ask at kitchen door', noteEs: 'pregunta en la puerta de la cocina' } },
    { id: 'L4', donor: 'Regional warehouse (simulated)', type: 'shelf-stable', qty: 200,
      diet: '', storage: 'ambient', deadlineMin: 4320, postedMin: -240,
      claimedBy: null,
      distribution: { org: 'Johnston Community Pantry', window: 'this week', windowEs: 'esta semana', note: 'family boxes', noteEs: 'cajas familiares' } }
  ];

  // The Needs Board — the demand side speaks.
  var needs = [
    { id: 'N1', org: 'Eastside Community Pantry', type: 'prepared', qty: 50,
      label: '50 meals for Saturday family night', by: 'Sat 10 AM', note: 'serves ~120 people' },
    { id: 'N2', org: 'Johnston Community Pantry', type: 'produce', qty: 200,
      label: '200 lbs of mixed veg weekly', by: 'ongoing', note: 'cold storage on site' },
    { id: 'N3', org: 'Hope Shelter Kitchen', type: 'shelf-stable', qty: 100,
      label: 'Pantry staples — rice, beans, canned protein', by: 'this month', note: '' }
  ];

  var meta = {
    mealCost: 3.52, lbsPerMeal: 1.2,
    weights: { urgency: 0.35, distance: 0.30, capacity: 0.20, transport: 0.15 }
  };

  return { orgs: orgs, listings: listings, needs: needs, meta: meta };
});
