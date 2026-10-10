/* Simple map that works with no internet and no keys: numbered pins drawn on a plain background with a scale bar.
   When the device is online it also lays OpenStreetMap tiles underneath (optional, opts.tiles). Tiles that cannot load just stay blank.
   Uses standard web-map maths (zoom + pixels), so pins line up with the tiles.
   ToolkitMap.view(points, {w, h, pad, maxZoom, minZoom, center:[lat,lon]}) -> view  (points: [{lat, lon, ...}])
   ToolkitMap.svg(view, pins, {tiles, label}) -> html string for an <svg>. pins: [{id, n, lat, lon, color, label, selected}]
        each pin is <g class="pin" data-id=.. tabindex=0 role=button>; clicking the empty map is left to the app
   ToolkitMap.fromEvent(svgEl, evt, view) -> {lat, lon} where the person tapped (for "tap to place the pin")
   ToolkitMap.project(view, lat, lon) -> {x, y};  ToolkitMap.invert(view, x, y) -> {lat, lon}
   ToolkitMap.valid(lat, lon) -> true for usable numbers. Trusted html only: the app must escape pin labels itself (they are escaped here). */
(function (root) {
  'use strict';
  var T = 256;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function valid(lat, lon) { return typeof lat === 'number' && typeof lon === 'number' && isFinite(lat) && isFinite(lon) && Math.abs(lat) < 85 && Math.abs(lon) <= 180; }
  function px(lon, z) { return (lon + 180) / 360 * T * Math.pow(2, z); }
  function py(lat, z) { var s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * T * Math.pow(2, z); }
  function view(points, o) {
    o = o || {}; var w = o.w || 900, h = o.h || 520, pad = o.pad == null ? 60 : o.pad, maxZ = o.maxZoom || 15, minZ = o.minZoom || 2;
    var pts = (points || []).filter(function (p) { return valid(p.lat, p.lon); }), z = 13, cx, cy, i;
    if (!pts.length) { var c = o.center || [39.0, -98.0]; z = o.center ? 12 : 4; return { z: z, cx: px(c[1], z), cy: py(c[0], z), w: w, h: h, empty: true }; }
    for (z = maxZ; z > minZ; z--) {
      var x0 = 1e12, x1 = -1e12, y0 = 1e12, y1 = -1e12;
      for (i = 0; i < pts.length; i++) { var x = px(pts[i].lon, z), y = py(pts[i].lat, z); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 - x0 + 2 * pad <= w && y1 - y0 + 2 * pad <= h) { cx = (x0 + x1) / 2; cy = (y0 + y1) / 2; break; }
    }
    if (cx == null) { cx = (x0 + x1) / 2; cy = (y0 + y1) / 2; }
    return { z: z, cx: cx, cy: cy, w: w, h: h };
  }
  function project(v, lat, lon) { return { x: px(lon, v.z) - (v.cx - v.w / 2), y: py(lat, v.z) - (v.cy - v.h / 2) }; }
  function invert(v, x, y) {
    var X = x + v.cx - v.w / 2, Y = y + v.cy - v.h / 2, n = Math.pow(2, v.z) * T;
    var lon = X / n * 360 - 180, m = Math.PI - 2 * Math.PI * Y / n;
    return { lat: 180 / Math.PI * Math.atan(0.5 * (Math.exp(m) - Math.exp(-m))), lon: lon };
  }
  function scale(v) {
    var lat = invert(v, v.w / 2, v.h / 2).lat, mPerPx = 40075016.686 * Math.cos(lat * Math.PI / 180) / (T * Math.pow(2, v.z)), best = null;
    [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100].forEach(function (mi) { var wpx = mi * 1609.34 / mPerPx; if (wpx <= 170) best = { mi: mi, px: wpx }; });
    return best;
  }
  function svg(v, pins, o) {
    o = o || {}; var s = '<svg class="tmap" viewBox="0 0 ' + v.w + ' ' + v.h + '" role="group" aria-label="' + esc(o.label || 'Map') + '" xmlns="http://www.w3.org/2000/svg">';
    s += '<rect class="tmap-bg" width="' + v.w + '" height="' + v.h + '"/>';
    if (o.tiles && !v.empty) {
      var ox = v.cx - v.w / 2, oy = v.cy - v.h / 2, n = Math.pow(2, v.z), tx, ty;
      for (tx = Math.floor(ox / T); tx <= Math.floor((ox + v.w) / T); tx++) for (ty = Math.floor(oy / T); ty <= Math.floor((oy + v.h) / T); ty++) {
        if (ty < 0 || ty >= n) continue;
        s += '<image href="https://tile.openstreetmap.org/' + v.z + '/' + (((tx % n) + n) % n) + '/' + ty + '.png" x="' + (tx * T - ox) + '" y="' + (ty * T - oy) + '" width="' + T + '" height="' + T + '"/>';
      }
    }
    var sc = v.empty ? null : scale(v);
    if (sc) s += '<g class="tmap-scale" transform="translate(14,' + (v.h - 30) + ')"><rect x="-6" y="-6" width="' + (sc.px + 12 + 70) + '" height="30" rx="6" fill="rgba(255,255,255,.85)"/><path d="M0 14V4H' + sc.px + 'V14" fill="none" stroke="#111" stroke-width="2"/><text x="' + (sc.px + 8) + '" y="14" font-size="13" fill="#111">' + sc.mi + ' mi</text></g>';
    if (o.tiles && !v.empty) s += '<text x="' + (v.w - 8) + '" y="' + (v.h - 8) + '" text-anchor="end" font-size="11" fill="#111" stroke="#fff" stroke-width="3" paint-order="stroke">© OpenStreetMap contributors</text>';
    (pins || []).forEach(function (p) {
      if (!valid(p.lat, p.lon)) return;
      var q = project(v, p.lat, p.lon), r = p.selected ? 20 : 16;
      s += '<g class="pin" data-id="' + esc(p.id) + '" tabindex="0" role="button" aria-label="' + esc(p.label || p.n) + '" transform="translate(' + q.x.toFixed(1) + ',' + q.y.toFixed(1) + ')">' +
        '<circle r="' + r + '" fill="' + esc(p.color || '#1c55b0') + '" stroke="' + (p.selected ? '#ffc857' : '#fff') + '" stroke-width="' + (p.selected ? 4 : 3) + '"/>' +
        '<text y="5" text-anchor="middle" font-size="' + (String(p.n).length > 2 ? 11 : 15) + '" font-weight="700" fill="#fff">' + esc(p.n) + '</text></g>';
    });
    return s + '</svg>';
  }
  function fromEvent(el, e, v) {
    var r = el.getBoundingClientRect(); if (!r.width) return null;
    return invert(v, (e.clientX - r.left) * v.w / r.width, (e.clientY - r.top) * v.h / r.height);
  }
  var api = { view: view, svg: svg, project: project, invert: invert, fromEvent: fromEvent, valid: valid, scale: scale };
  root.ToolkitMap = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
