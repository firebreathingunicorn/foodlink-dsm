/* FoodLink i18n — EN/ES for the household side (demo scope).
   Des Moines context: Spanish is the top non-English language (11.5% of city residents);
   Karen/Swahili/Arabic support is the documented next step (see PLAN-v2 §6). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoodLinkI18N = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var S = {
    en: {
      title: 'Free food near you', sub: 'No account needed. It just shows up.',
      today: 'TODAY', sat: 'SATURDAY', via: 'through', dist: 'distribution',
      noAppt: 'no appointment needed', confirmed: 'confirmed by the receiving organization',
      arriveEarly: 'arrive early', expiry: 'Cards expire on their own — you will never see food that is already gone.',
      filterToday: 'Today', filterVeg: 'Vegetarian', filterNear: 'Under 3 mi', all: 'All',
      meals: 'prepared meals', prepared: 'prepared meals', produce: 'fresh produce', bakery: 'bakery items',
      'shelf-stable': 'pantry staples', dairy: 'dairy', frozen: 'frozen food',
      until: 'until', smsTitle: 'Any-phone lane', smsSub: 'This is how it works on a flip phone:',
      diets: { vegetarian: 'vegetarian', vegan: 'vegan', halal: 'halal', 'gluten-free': 'gluten-free', kosher: 'kosher' }
    },
    es: {
      title: 'Comida gratis cerca de ti', sub: 'No necesitas cuenta. Solo aparece.',
      today: 'HOY', sat: 'SÁBADO', via: 'a través de', dist: 'distribución',
      noAppt: 'sin cita', confirmed: 'confirmado por la organización receptora',
      arriveEarly: 'llega temprano', expiry: 'Las tarjetas caducan solas — nunca verás comida que ya no está.',
      filterToday: 'Hoy', filterVeg: 'Vegetariano', filterNear: 'Menos de 3 mi', all: 'Todo',
      meals: 'comidas preparadas', prepared: 'comidas preparadas', produce: 'productos frescos', bakery: 'pan',
      'shelf-stable': 'productos de despensa', dairy: 'lácteos', frozen: 'congelados',
      until: 'hasta las', smsTitle: 'Cualquier teléfono', smsSub: 'Así funciona en un teléfono básico:',
      diets: { vegetarian: 'vegetariano', vegan: 'vegano', halal: 'halal', 'gluten-free': 'sin gluten', kosher: 'kosher' }
    }
  };
  var lang = 'en';
  return {
    set: function (l) { lang = (S[l] ? l : 'en'); },
    get: function () { return lang; },
    t: function (k) { return (S[lang] && S[lang][k]) || S.en[k] || k; },
    diet: function (k) { return (S[lang] && S[lang].diets && S[lang].diets[k]) || k; }
  };
});
