/* FoodLink icons — inline SVG set (no emojis anywhere in the product).
   Usage: ic('pin') returns an <svg> that scales with font-size (width/height 1em). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoodLinkIcons = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function wrap(inner) {
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  var P = {
    grid: '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="6" cy="17" r="2"/>' +
      '<circle cx="18" cy="17" r="2"/><circle cx="12" cy="12" r="1.6"/>' +
      '<path d="M7.4 8.4 10.7 11M16.6 8.4 13.3 11M7.4 15.6l3.3-2.6M16.6 15.6l-3.3-2.6"/>',
    need: '<path d="M4 13h16v.6a6.4 6.4 0 0 1-6.4 6.4h-3.2A6.4 6.4 0 0 1 4 13.6V13Z"/><path d="M9 8.5V7M12 8.5V6M15 8.5V7"/>',
    store: '<path d="M4.6 9 6 4.5h12L19.4 9"/><path d="M4.6 9a2.4 2.4 0 0 0 4.8 0 2.4 2.4 0 0 0 4.8 0 2.4 2.4 0 0 0 4.8 0"/>' +
      '<path d="M5.5 12.5V20h13v-7.5M9.5 20v-5h5v5"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    home: '<path d="m3 10.5 9-7.5 9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3c-1.5 0-3-.4-4.3-1.2L3 20l1.4-4.1A8.3 8.3 0 1 1 21 11.5Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    pin: '<path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    cold: '<path d="M12 2.5v19M3.3 7.3l17.4 9.4M20.7 7.3 3.3 16.7"/>',
    box: '<path d="m12 2.8 8.5 4.7v9L12 21.2l-8.5-4.7v-9L12 2.8Z"/><path d="m3.5 7.5 8.5 4.7 8.5-4.7M12 12.2v9"/>',
    leaf: '<path d="M11 20a7 7 0 0 1-7-7c0-4.2 3.1-7.9 9-9 4-.8 7-.5 7-.5s.2 3.1-.5 7c-1.1 5.9-4.8 9-8.5 9.5Z"/><path d="M4.5 19.5 11 13"/>',
    grain: '<path d="M12 21V8"/><path d="M12 12C8 12 6 9.5 6 5.5 10 5.5 12 8 12 12ZM12 12c4 0 6-2.5 6-6.5-4 0-6 2.5-6 6.5ZM12 17c-3.2 0-5-2.1-5-5.5 3.2 0 5 2.1 5 5.5ZM12 17c3.2 0 5-2.1 5-5.5-3.2 0-5 2.1-5 5.5Z"/>',
    gear: '<path d="M4 7.5h8.5M17.5 7.5H20"/><circle cx="15" cy="7.5" r="2.4"/>' +
      '<path d="M4 16.5h2.5M11.5 16.5H20"/><circle cx="9" cy="16.5" r="2.4"/>',
    qr: '<path d="M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6Z"/><path d="M14 14h2.5v2.5H14V14ZM18 14h2M14 18.5h2.5M18 18.5h2v2M14 21.5h2"/>',
    download: '<path d="M12 3.5V15M7 10.5l5 5 5-5"/><path d="M4.5 20.5h15"/>',
    check: '<path d="m4.5 12.5 5 5.5L19.5 6.5"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrowRight: '<path d="M4 12h15M13.5 6l6 6-6 6"/>',
    arrowLeft: '<path d="M20 12H5M10.5 18l-6-6 6-6"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15.5.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.4-3.4 3-5.6 6.2-5.6s5.8 2.2 6.2 5.6"/>' +
      '<path d="M15.8 4.9a3.4 3.4 0 0 1 0 6.2M17.6 14.5c2.2.8 3.6 2.7 3.7 5.5"/>',
    truck: '<path d="M2.5 6.5H13V16H2.5V6.5Z"/><path d="M13 9.5h4l3.5 3.5v3h-3"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/><path d="M8.5 17.5h6"/>',
    broadcast: '<circle cx="12" cy="12" r="2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 19.1a10.2 10.2 0 0 1 0-14.2M19.1 4.9a10.2 10.2 0 0 1 0 14.2"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="1.8"/><path d="M9 4.5h6V7H9V4.5Z"/><path d="M9 12h6M9 16h4"/>',
    building: '<rect x="4.5" y="3.5" width="15" height="17" rx="1.2"/><path d="M9 7.5h1.5M13.5 7.5H15M9 11.5h1.5M13.5 11.5H15M10 20.5v-3.5h4v3.5"/>',
    file: '<path d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7L14 3Z"/><path d="M14 3v4.5h4M9.5 13h5M9.5 16.5h5"/>',
    shield: '<path d="m12 3 7 3v5.8c0 4.4-3 7.7-7 9.2-4-1.5-7-4.8-7-9.2V6l7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    phone: '<path d="M5.5 4h3.2L10 8.2 8.2 9.8a12.5 12.5 0 0 0 6 6L15.8 14l4.2 1.3v3.2a1.8 1.8 0 0 1-2 1.8A16.3 16.3 0 0 1 3.7 6a1.8 1.8 0 0 1 1.8-2Z"/>',
    chevDown: '<path d="m6 9.5 6 6 6-6"/>',
    chevUp: '<path d="m6 14.5 6-6 6 6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8h.01M12 11.5V16"/>',
    scale: '<path d="M12 4v16M7 6.5h10"/><path d="m7 6.5-3.5 7h7L7 6.5ZM17 6.5l-3.5 7h7l-3.5-7Z"/><path d="M8.5 20.5h7"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 3.9 5.1 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.1-3.9-8.5s1.3-6.2 3.9-8.5Z"/>',
    plate: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>'
  };
  function ic(name) { return wrap(P[name] || P.info); }
  ic.names = Object.keys(P);
  return ic;
});
