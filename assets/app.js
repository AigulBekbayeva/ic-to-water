/* Ice to Water — three maps of the world's glaciers. Plain JavaScript, MapLibre GL JS for the map. */
(function () {
  "use strict";

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var fmt = function (n) { return n.toLocaleString("en-US"); };
  var signed = function (v, d) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(d); };

  var app = $(".app"), story = $("#story"), legend = $("#legend"), tip = $("#tip"), stage = $(".stage");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var REG = {}, BAS = {};
  REGIONS.forEach(function (r) { REG[r.id] = r; });
  BASINS.forEach(function (b) { BAS[b.id] = b; });
  var maxArea = Math.max.apply(null, REGIONS.map(function (r) { return r.area; }));
  var maxRate = Math.max.apply(null, REGIONS.map(function (r) { return Math.abs(r.rate); }));

  function rateClass(rate) {
    var a = Math.abs(rate);
    for (var i = 0; i < RATE_CLASSES.length; i++) if (a < RATE_CLASSES[i].max) return i;
    return RATE_CLASSES.length - 1;
  }
  function rateColor(rate) { return RATE_CLASSES[rateClass(rate)].color; }

  var risingCountries = [];
  BASINS.forEach(function (b) {
    if (b.cls === "rising") b.countries.forEach(function (c) { if (risingCountries.indexOf(c) < 0) risingCountries.push(c); });
  });

  var C = {
    ocean: "#c5d7de", land: "#eceee8", border: "#c3ccc8", ice: "#0b5c8e", iceSoft: "#8fb8d0",
    sheetLine: "#7fb0cc", river: "#a9c3cf", riverStrong: "#86aabb", ink: "#0f2430"
  };
  var VIEWS = { 1: { center: [12, 50], zoom: 1.95 }, 2: { center: [12, 50], zoom: 1.95 }, 3: { center: [72, 37], zoom: 2.55 } };
  var startMap = (/map=([123])/.exec(location.hash) || [0, 1])[1];
  function homeView(n) {
    var w = stage.clientWidth, v = VIEWS[n];
    return { center: v.center, zoom: v.zoom - (w < 600 ? 1.0 : w < 900 ? 0.4 : 0) };
  }
  var WORLD_VIEW = homeView(startMap);
  var state = { map: 1, sel: null, hot: null };

  /* ------------------------------------------------------------------ map */

  var map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      projection: { type: "globe" },
      sources: {},
      layers: [{ id: "ocean", type: "background", paint: { "background-color": C.ocean } }]
    },
    center: WORLD_VIEW.center,
    zoom: WORLD_VIEW.zoom,
    minZoom: 0.5,
    maxZoom: 7.5,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false
  });
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.addControl(new maplibregl.AttributionControl({
    compact: true,
    customAttribution: "Natural Earth, RGI 7.0, GlaMBIE 2025, Huss & Hock 2018, IPCC SROCC"
  }), "bottom-right");

  map.on("error", function (e) {
    var msg = e && e.error && e.error.message ? e.error.message : "";
    if (/Failed to fetch|404|NetworkError|AJAXError/i.test(msg)) {
      var box = $("#load-error");
      box.textContent = "Map data did not load. Open this page through a web server (GitHub Pages, or \"python -m http.server\" in the project folder), not as a local file.";
      box.hidden = false;
    }
  });

  function pointFC(items, props) {
    return {
      type: "FeatureCollection",
      features: items.map(function (it) {
        return { type: "Feature", properties: props(it), geometry: { type: "Point", coordinates: it.pt } };
      })
    };
  }

  function matchBy(prop, pairs, fallback) {
    var ex = ["match", ["get", prop]];
    pairs.forEach(function (p) { ex.push(p[0], p[1]); });
    ex.push(fallback);
    return ex;
  }

  var basinColor = matchBy("b", BASINS.map(function (b) { return [b.id, PEAK_CLASSES[b.cls].color]; }), "#6f7b83");
  var glacierRateColor = matchBy("r", REGIONS.map(function (r) { return [r.id, rateColor(r.rate)]; }), "#ffffff");

  map.on("load", function () {
    map.addSource("countries", { type: "geojson", data: "data/countries.geojson" });
    map.addSource("lakes", { type: "geojson", data: "data/lakes.geojson" });
    map.addSource("rivers", { type: "geojson", data: "data/rivers_base.geojson" });
    map.addSource("glrivers", { type: "geojson", data: "data/rivers_glacier.geojson" });
    map.addSource("glaciers", { type: "geojson", data: "data/glaciers.geojson" });
    map.addSource("regions", {
      type: "geojson",
      data: pointFC(REGIONS, function (r) { return { id: r.id, rad: 5 + 30 * Math.sqrt(r.area / maxArea) }; })
    });
    map.addSource("basins", {
      type: "geojson",
      data: pointFC(BASINS, function (b) { return { b: b.id, loss10: b.loss10 ? 1 : 0 }; })
    });

    map.addLayer({
      id: "land", type: "fill", source: "countries",
      paint: { "fill-color": ["match", ["get", "a3"], "ATA", "#ffffff", C.land] }
    });
    map.addLayer({
      id: "tint", type: "fill", source: "countries", layout: { visibility: "none" },
      filter: ["in", ["get", "a3"], ["literal", risingCountries]],
      paint: { "fill-color": PEAK_CLASSES.rising.color, "fill-opacity": 0.2 }
    });
    map.addLayer({
      id: "hl", type: "fill", source: "countries", layout: { visibility: "none" },
      filter: ["in", ["get", "a3"], ["literal", []]],
      paint: { "fill-color": C.ink, "fill-opacity": 0.1 }
    });
    map.addLayer({ id: "borders", type: "line", source: "countries", paint: { "line-color": C.border, "line-width": 0.6 } });
    map.addLayer({
      id: "hl-line", type: "line", source: "countries", layout: { visibility: "none" },
      filter: ["in", ["get", "a3"], ["literal", []]],
      paint: { "line-color": C.ink, "line-width": 1.2 }
    });
    map.addLayer({ id: "lakes", type: "fill", source: "lakes", paint: { "fill-color": C.ocean } });
    map.addLayer({
      id: "rivers", type: "line", source: "rivers",
      paint: { "line-color": C.river, "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 5, 1.1] }
    });
    map.addLayer({
      id: "sheets", type: "fill", source: "glaciers", filter: ["==", ["get", "r"], 0],
      paint: { "fill-color": "#ffffff", "fill-antialias": false }
    });
    map.addLayer({
      id: "glaciers", type: "fill", source: "glaciers", filter: ["!=", ["get", "r"], 0],
      paint: { "fill-color": C.ice }
    });
    map.addLayer({
      id: "glaciers-line", type: "line", source: "glaciers", filter: ["!=", ["get", "r"], 0],
      paint: { "line-color": C.ice, "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.7, 5, 0.3] }
    });
    map.addLayer({
      id: "glrivers-hl", type: "line", source: "glrivers", layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      filter: ["==", ["get", "b"], ""],
      paint: { "line-color": C.ink, "line-width": ["interpolate", ["linear"], ["zoom"], 1, 4.5, 5, 7] }
    });
    map.addLayer({
      id: "glrivers", type: "line", source: "glrivers", layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: { "line-color": basinColor, "line-width": ["interpolate", ["linear"], ["zoom"], 1, 2, 5, 3.4] }
    });
    map.addLayer({
      id: "reg-circles", type: "circle", source: "regions",
      paint: {
        "circle-radius": ["get", "rad"],
        "circle-color": "rgba(11, 92, 142, 0.13)",
        "circle-stroke-color": C.ice,
        "circle-stroke-width": 1.2
      }
    });
    map.addLayer({
      id: "reg-hl", type: "circle", source: "regions", filter: ["==", ["get", "id"], -1],
      paint: {
        "circle-radius": ["+", ["get", "rad"], 3],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": C.ink,
        "circle-stroke-width": 2
      }
    });
    map.addLayer({
      id: "basin-ring", type: "circle", source: "basins", layout: { visibility: "none" },
      filter: ["==", ["get", "loss10"], 1],
      paint: { "circle-radius": 9.5, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": C.ink, "circle-stroke-width": 1.4 }
    });
    map.addLayer({
      id: "basin-dots", type: "circle", source: "basins", layout: { visibility: "none" },
      paint: { "circle-radius": 5.5, "circle-color": basinColor, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 }
    });

    buildMarkers();
    applyMap();
    map.on("mousemove", onMapMove);
    map.on("mouseout", hideTip);
    map.on("click", onMapClick);
    map.on("zoom", updateLabelZoom);
    if (stage.clientWidth < 600) {
      var att = $(".maplibregl-ctrl-attrib");
      if (att) { att.classList.remove("maplibregl-compact-show"); att.removeAttribute("open"); }
    }
    stage.setAttribute("data-ready", "1");
  });

  /* -------------------------------------------------------------- markers */

  var regionMarkers = [], basinMarkers = [];
  var LABEL_SIDE = {"aral": "right", "indus": "right", "ganges": "top", "rhone": "right", "rhine": "right", "skeena": "right", "nass": "right", "taku": "right", "susitna": "right", "santa": "right", "baker": "right"};

  function buildMarkers() {
    REGIONS.forEach(function (r) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "rg";
      el.dataset.kind = "region";
      el.dataset.id = r.id;
      var ci = rateClass(r.rate);
      el.style.setProperty("--c", RATE_CLASSES[ci].color);
      el.style.setProperty("--t", ci >= 2 ? "#ffffff" : C.ink);
      el.setAttribute("aria-label", r.name);
      el.innerHTML = "<b>" + r.id + "</b><span>" + signed(r.rate, 2) + "%</span>";
      wireMarker(el);
      var m = new maplibregl.Marker({ element: el, anchor: "left", offset: [-10, 0], opacityWhenCovered: "0" }).setLngLat(r.pt);
      regionMarkers.push(m);
    });
    BASINS.forEach(function (b) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "bl";
      el.dataset.kind = "basin";
      el.dataset.id = b.id;
      el.dataset.lz = b.lz;
      el.textContent = b.name;
      wireMarker(el);
      var side = LABEL_SIDE[b.id] || "left";
      el.dataset.side = side;
      var m = new maplibregl.Marker({ element: el, anchor: side, opacityWhenCovered: "0" }).setLngLat(b.pt);
      basinMarkers.push(m);
    });
  }

  function wireMarker(el) {
    el.addEventListener("click", function (e) { e.stopPropagation(); select(el.dataset.kind, el.dataset.id, true); });
    el.addEventListener("mouseenter", function (e) { setHot(el.dataset.kind, el.dataset.id); showTipFor(el.dataset.kind, el.dataset.id, e); });
    el.addEventListener("mousemove", function (e) { moveTip(e); });
    el.addEventListener("mouseleave", function () { setHot(null); hideTip(); });
    el.addEventListener("focus", function () { setHot(el.dataset.kind, el.dataset.id); });
    el.addEventListener("blur", function () { setHot(null); });
  }

  function updateLabelZoom() {
    var z = map.getZoom();
    basinMarkers.forEach(function (m) {
      var el = m.getElement();
      el.classList.toggle("is-zoom-hidden", z < parseFloat(el.dataset.lz));
    });
  }

  /* ---------------------------------------------------------- map modes */

  function vis(id, on) { if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none"); }

  function applyMap() {
    if (!map.getLayer("glaciers")) return;
    var n = state.map;
    var fill = n === 1 ? C.ice : n === 2 ? glacierRateColor : C.iceSoft;
    map.setPaintProperty("glaciers", "fill-color", fill);
    map.setPaintProperty("glaciers-line", "line-color", fill);
    map.setPaintProperty("rivers", "line-color", n === 3 ? C.riverStrong : C.river);
    vis("reg-circles", n === 1);
    vis("reg-hl", n === 1);
    ["tint", "hl", "hl-line", "glrivers", "glrivers-hl", "basin-ring", "basin-dots"].forEach(function (id) { vis(id, n === 3); });
    regionMarkers.forEach(function (m) { if (n === 3) m.remove(); else m.addTo(map); });
    basinMarkers.forEach(function (m) { if (n === 3) m.addTo(map); else m.remove(); });
    updateLabelZoom();
    highlight();
  }

  function highlight() {
    if (!map.getLayer("glaciers")) return;
    var cur = state.hot || state.sel;
    var regId = cur && cur.kind === "region" ? Number(cur.id) : -1;
    var basId = cur && cur.kind === "basin" ? cur.id : "";
    map.setFilter("reg-hl", ["==", ["get", "id"], regId]);
    map.setFilter("glrivers-hl", ["==", ["get", "b"], basId]);
    var cs = basId && BAS[basId] ? BAS[basId].countries : [];
    map.setFilter("hl", ["in", ["get", "a3"], ["literal", cs]]);
    map.setFilter("hl-line", ["in", ["get", "a3"], ["literal", cs]]);
    $$(".row", story).forEach(function (row) {
      row.classList.toggle("is-hot", !!cur && row.dataset.kind === cur.kind && row.dataset.id === String(cur.id));
    });
    regionMarkers.concat(basinMarkers).forEach(function (m) {
      var el = m.getElement();
      el.classList.toggle("is-hot", !!cur && el.dataset.kind === cur.kind && el.dataset.id === String(cur.id));
    });
  }

  function setHot(kind, id) {
    state.hot = kind ? { kind: kind, id: String(id) } : null;
    highlight();
  }

  function select(kind, id, fromMap) {
    id = String(id);
    var same = state.sel && state.sel.kind === kind && state.sel.id === id;
    state.sel = same && !fromMap ? null : { kind: kind, id: id };
    $$(".row", story).forEach(function (row) {
      var on = !!state.sel && row.dataset.kind === state.sel.kind && row.dataset.id === state.sel.id;
      row.setAttribute("aria-expanded", on ? "true" : "false");
      var d = row.parentNode.querySelector(".detail");
      if (d) d.hidden = !on;
      if (on && fromMap && row.scrollIntoView) row.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    });
    highlight();
    if (!state.sel) return;
    var target = kind === "region" ? REG[id] : BAS[id];
    var zoom = kind === "region" ? target.zoom : Math.max(3.2, Math.min(map.getZoom(), 4.2));
    map.flyTo({ center: target.pt, zoom: zoom, duration: reduceMotion ? 0 : 1300, essential: true });
  }

  /* ------------------------------------------------------------- tooltip */

  function regionTip(r) {
    if (state.map === 2) {
      return "<b>" + r.name + "</b><span>Area change " + signed(r.rate, 2) + "% per year<br>Mass change " + signed(r.smb, 2) + " m w.e. per year</span>";
    }
    return "<b>" + r.name + "</b><span>" + fmt(r.area) + " km² in " + fmt(r.count) + " glaciers</span>";
  }
  function basinTip(b) {
    return "<b>" + b.name + (b.sub ? " (" + b.sub + ")" : "") + "</b><span>" + PEAK_CLASSES[b.cls].short +
      "<br>" + b.countries.map(function (c) { return COUNTRY_NAMES[c] || c; }).join(", ") + "</span>";
  }
  function showTipFor(kind, id, e) {
    tip.innerHTML = kind === "region" ? regionTip(REG[id]) : basinTip(BAS[id]);
    tip.hidden = false;
    moveTip(e);
  }
  function moveTip(e) {
    var box = stage.getBoundingClientRect();
    placeTip(e.clientX - box.left, e.clientY - box.top);
  }
  function placeTip(x, y) {
    var w = stage.clientWidth, h = stage.clientHeight;
    tip.style.left = Math.min(x, w - tip.offsetWidth - 20) + "px";
    tip.style.top = Math.min(y, h - tip.offsetHeight - 20) + "px";
  }
  function hideTip() { tip.hidden = true; }

  function featureAt(point) {
    var layers = state.map === 3 ? ["basin-dots", "glrivers"] : ["glaciers", "sheets"];
    var fs = map.queryRenderedFeatures([[point.x - 3, point.y - 3], [point.x + 3, point.y + 3]], { layers: layers });
    return fs.length ? fs[0] : null;
  }

  function onMapMove(e) {
    var f = featureAt(e.point);
    map.getCanvas().style.cursor = f ? "pointer" : "";
    if (!f) { hideTip(); if (state.hot) setHot(null); return; }
    if (state.map === 3) {
      var b = BAS[f.properties.b];
      tip.innerHTML = basinTip(b);
      if (!state.hot || state.hot.id !== b.id) setHot("basin", b.id);
    } else if (f.properties.r === 0) {
      tip.innerHTML = "<b>Ice sheet</b><span>Greenland and Antarctic ice sheets are not counted in the 19 glacier regions.</span>";
      map.getCanvas().style.cursor = "";
      if (state.hot) setHot(null);
    } else {
      var r = REG[f.properties.r];
      tip.innerHTML = regionTip(r);
      if (!state.hot || state.hot.id !== String(r.id)) setHot("region", r.id);
    }
    tip.hidden = false;
    placeTip(e.point.x, e.point.y);
  }

  function onMapClick(e) {
    var f = featureAt(e.point);
    if (!f) return;
    if (state.map === 3) select("basin", f.properties.b, true);
    else if (f.properties.r !== 0) select("region", f.properties.r, true);
  }

  /* --------------------------------------------------------------- story */

  function regionDetail(r) {
    return '<dl class="detail" hidden>' +
      "<dt>Glaciers</dt><dd>" + fmt(r.count) + "</dd>" +
      "<dt>Area</dt><dd>" + fmt(r.area) + " km², " + (100 * r.area / WORLD.area).toFixed(1) + "% of the world total</dd>" +
      "<dt>Area change</dt><dd>" + signed(r.rate, 2) + "% per year</dd>" +
      "<dt>Mass change 2000–2023</dt><dd>" + signed(r.smb, 2) + " m water equivalent per year (" + signed(r.gt, 1) + " Gt per year)</dd>" +
      "</dl>";
  }

  function regionRows(sorted, value, barWidth, barColor) {
    return '<ul class="rows">' + sorted.map(function (r) {
      return '<li><button type="button" class="row" data-kind="region" data-id="' + r.id + '" aria-expanded="false">' +
        '<span class="n">' + (r.id < 10 ? "0" : "") + r.id + "</span>" +
        '<span class="nm">' + r.name + "</span>" +
        '<span class="v">' + value(r) + "</span>" +
        '<span class="bar"><i style="width:' + barWidth(r).toFixed(1) + "%;background:" + barColor(r) + '"></i></span>' +
        "</button>" + regionDetail(r) + "</li>";
    }).join("") + "</ul>";
  }

  function sources(items) {
    return '<section class="sources"><h2>Sources</h2><ul>' + items.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul></section>";
  }

  var SRC = {
    ne: 'Glacier, country, river and lake shapes: <a href="https://www.naturalearthdata.com/">Natural Earth</a>, 1:10m and 1:50m, public domain.',
    rgi: 'Glacier counts and areas: RGI 7.0 Consortium (2023), <a href="https://doi.org/10.5067/f6jmovy5navz">Randolph Glacier Inventory 7.0</a>, NSIDC.',
    glambie: 'Mass change 2000–2023 and regional area-change rates: The GlaMBIE Team (2025), <a href="https://doi.org/10.1038/s41586-024-08545-z">Community estimate of global glacier mass changes from 2000 to 2023</a>, Nature 639; rates as listed in the <a href="https://github.com/earthwave/glambie">GlaMBIE code</a>.',
    zemp: 'Origin of the area-change rates: Zemp et al. (2019), <a href="https://doi.org/10.1038/s41586-019-1071-0">Global glacier mass changes and their contributions to sea-level rise from 1961 to 2016</a>, Nature 568.',
    hh: 'Peak water in 56 basins: Huss &amp; Hock (2018), <a href="https://doi.org/10.1038/s41558-017-0049-x">Global-scale hydrological response to future glacier mass loss</a>, Nature Climate Change 8.',
    srocc: 'Regional peak-water shares and basin studies: IPCC (2019), <a href="https://www.ipcc.ch/srocc/chapter/chapter-2/">SROCC, Chapter 2: High Mountain Areas</a>, section 2.3.1 and Table SM2.10.',
    lyu: 'High Mountain Asia peak years: Lyu et al. (2024), <a href="https://doi.org/10.1016/j.fmre.2024.12.006">Variations in glacier peak water timing and its influencing factors in High-Mountain Asia</a>, Fundamental Research.'
  };

  function story1() {
    var sorted = REGIONS.slice().sort(function (a, b) { return b.area - a.area; });
    return "<h1>Where are the glaciers?</h1>" +
      '<p class="lede">The Randolph Glacier Inventory counts about 275,000 glaciers outside the two great ice sheets. Most of that ice is far from where people live.</p>' +
      '<div class="figures"><div><b>' + fmt(WORLD.count) + "</b><span>glaciers</span></div><div><b>" + fmt(WORLD.area) + " km²</b><span>of glacier ice</span></div></div>" +
      "<p>Five polar and subpolar regions hold 65% of all glacier area: the Antarctic and Subantarctic islands, Arctic Canada North and South, Greenland’s periphery and Alaska. High Mountain Asia, the largest store outside the polar regions, holds 14%. The Alps and Pyrenees hold 0.3%.</p>" +
      "<h2>Glacier area by region, km²</h2>" +
      '<p class="hint">Select a region to zoom in. Circles on the map are scaled to the same areas.</p>' +
      regionRows(sorted, function (r) { return fmt(r.area); }, function (r) { return 100 * r.area / maxArea; }, function () { return C.ice; }) +
      '<p class="note">Glacier shapes are generalised and assigned to the 19 inventory regions by approximate boundaries. The Greenland and Antarctic ice sheets, drawn in white, are not part of those regions.</p>' +
      sources([SRC.rgi, SRC.ne]);
  }

  function story2() {
    var sorted = REGIONS.slice().sort(function (a, b) { return a.rate - b.rate; });
    return "<h1>Where is glacier area shrinking fastest?</h1>" +
      '<p class="lede">Everywhere, but not at the same speed. The smallest glacier regions are disappearing fastest, while the big Arctic ice caps thin without changing much in outline.</p>' +
      '<div class="figures"><div><b>−1.19% a year</b><span>Low Latitudes, the fastest</span></div><div><b>−0.07% a year</b><span>Arctic Canada North, the slowest</span></div></div>' +
      "<p>Tropical glaciers in the Andes, East Africa and New Guinea lose 1.19% of their area every year, 17 times the rate of the ice caps of Arctic Canada. Central Europe (−0.93%) and Greenland’s peripheral glaciers (−0.82%) follow.</p>" +
      "<p>Area is only part of the story. Measured as ice mass, glaciers lost 273 gigatonnes a year from 2000 to 2023, about 5% of their ice. Alaska alone accounts for 61 gigatonnes a year, and Central Europe lost 39% of its ice in that time.</p>" +
      "<h2>Area change by region, % per year</h2>" +
      '<p class="hint">Select a region for its glacier count, area and mass change.</p>' +
      regionRows(sorted, function (r) { return signed(r.rate, 2); }, function (r) { return 100 * Math.abs(r.rate) / maxRate; }, function (r) { return rateColor(r.rate); }) +
      '<p class="note">The rates are long-term averages compiled from regional studies with different observation periods. GlaMBIE uses them to account for glacier shrinkage. Read them as a ranking, not as a precise measurement.</p>' +
      sources([SRC.glambie, SRC.zemp, SRC.rgi, SRC.ne]);
  }

  function schematic() {
    var curve = "M8,96 C55,96 78,96 108,89 C158,77 172,34 204,34 C240,34 262,88 298,112 C318,124 338,127 352,128";
    return '<figure class="schematic">' +
      '<svg viewBox="0 0 360 146" role="img" aria-label="Schematic curve of glacier runoff over time: it rises to peak water, then falls below its starting level.">' +
      '<defs><clipPath id="up"><rect x="0" y="0" width="360" height="96"/></clipPath><clipPath id="dn"><rect x="0" y="96" width="360" height="62"/></clipPath></defs>' +
      '<path d="' + curve + ' L352,96 L8,96 Z" fill="#0A9F96" fill-opacity=".22" clip-path="url(#up)"/>' +
      '<path d="' + curve + ' L352,96 L8,96 Z" fill="#C4472B" fill-opacity=".22" clip-path="url(#dn)"/>' +
      '<line x1="8" y1="96" x2="352" y2="96" stroke="#6d8590" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<path d="' + curve + '" fill="none" stroke="#0f2430" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="204" y1="34" x2="204" y2="22" stroke="#0f2430" stroke-width="1"/>' +
      '<g font-family="Archivo, sans-serif" font-size="11.5" fill="#0f2430">' +
      '<text x="204" y="16" text-anchor="middle" font-weight="650">peak water</text>' +
      '<text x="204" y="74" text-anchor="middle" fill="#066b65">more water</text>' +
      '<text x="318" y="110" text-anchor="middle" fill="#9a3520">less</text>' +
      '<text x="10" y="112" fill="#44606e">runoff before glacier loss</text>' +
      '<text x="352" y="143" text-anchor="end" fill="#44606e">time, decades</text>' +
      "</g></svg>" +
      "<figcaption>Schematic of the peak-water concept, after Huss &amp; Hock (2018). Not to scale.</figcaption></figure>";
  }

  function basinRow(b) {
    var cls = PEAK_CLASSES[b.cls];
    var who = b.countries.map(function (c) { return COUNTRY_NAMES[c] || c; }).join(", ");
    return '<li><button type="button" class="row" data-kind="basin" data-id="' + b.id + '" aria-expanded="false">' +
      '<span class="dot' + (b.loss10 ? " ring" : "") + '" style="--c:' + cls.color + '"></span>' +
      '<span class="nm">' + b.name + (b.sub ? "<small>" + b.sub + "</small>" : "") + "</span>" +
      '<span class="v">' + (b.glac ? b.glac + '% <small>ice cover</small>' : "") + "</span>" +
      "</button>" +
      '<div class="detail" hidden><p>' + b.note + '</p><p class="who">' + who + (b.loss10 ? ". At least 10% less flow in at least one melt-season month by 2100." : ".") + "</p></div></li>";
  }

  function story3() {
    var order = ["rising", "past", "late", "unknown"];
    var groups = order.map(function (key) {
      var cls = PEAK_CLASSES[key];
      var list = BASINS.filter(function (b) { return b.cls === key; });
      var extra = key === "rising"
        ? ' <span class="who-all">Countries sharing these basins, tinted on the map: ' + risingCountries.map(function (c) { return COUNTRY_NAMES[c]; }).join(", ") + ".</span>"
        : "";
      return '<section class="group"><div class="group-h" style="--c:' + cls.color + '"><span class="sw"></span><h2>' + cls.name + "</h2></div>" +
        "<p>" + cls.text + extra + "</p>" +
        '<ul class="rows">' + list.map(basinRow).join("") + "</ul></section>";
    }).join("");
    return "<h1>Which waters depend on glaciers, and who gets more before getting less?</h1>" +
      '<p class="lede">A shrinking glacier first releases more water, then less. The turning point is called peak water, and which side of it a river is on decides whether glacier loss feels like a bonus or a shortage.</p>' +
      schematic() +
      "<p>Huss and Hock modelled the 56 large river basins that contain glaciers. Those basins cover 26% of the land outside Greenland and Antarctica and are home to almost a third of the world’s people. About 45% of them had passed peak water by 2017. In 22%, glacier runoff keeps rising beyond 2050.</p>" +
      "<p>After the peak the yearly total falls, and the late-summer flow that carries rivers through dry months and droughts weakens. By 2100 a third of the basins may lose more than 10% of their flow in at least one melt-season month.</p>" +
      '<p class="hint">Select a river to see its countries and the evidence. A ring marks basins with the largest expected losses.</p>' +
      groups +
      '<p class="note">Rivers and points stand in for whole basins; watershed boundaries are not drawn. Peak years move by a decade or more between emission scenarios. A whole country is tinted even where only part of it depends on glacier-fed rivers.</p>' +
      sources([SRC.hh, SRC.srocc, SRC.lyu, SRC.ne]);
  }

  /* -------------------------------------------------------------- legend */

  function legendHTML(n) {
    if (n === 1) {
      return "<h3>Glaciers and ice sheets</h3><ul>" +
        '<li><span class="sw" style="--c:' + C.ice + '"></span>Glaciers</li>' +
        '<li><span class="sw sheet"></span>Ice sheets, not counted as glaciers</li>' +
        '<li><span class="ci size"></span>Circle area shows a region’s glacier area</li></ul>';
    }
    if (n === 2) {
      return "<h3>Glacier area lost, % per year</h3>" +
        '<div class="ramp">' + RATE_CLASSES.map(function (c) { return '<i style="--c:' + c.color + '"></i>'; }).join("") + "</div>" +
        '<div class="ramp-l"><span>&lt; 0.1</span><span>0.1–0.3</span><span>0.3–0.5</span><span>0.5–0.9</span><span>&ge; 0.9</span></div>' +
        '<p class="foot">Glaciers and badges are coloured by the rate of their region. Badge numbers are the inventory region codes.</p>';
    }
    return "<h3>Glacier-fed rivers by peak-water timing</h3><ul>" +
      ["rising", "past", "late", "unknown"].map(function (k) {
        return '<li><span class="sw line" style="--c:' + PEAK_CLASSES[k].color + '"></span>' + PEAK_CLASSES[k].short + "</li>";
      }).join("") +
      '<li><span class="ci ring"></span>10% or more flow lost in a melt-season month by 2100</li>' +
      '<li><span class="sw tint" style="--c:' + PEAK_CLASSES.rising.color + '"></span>Countries sharing the mid-century-peak basins</li>' +
      '<li><span class="sw" style="--c:' + C.iceSoft + '"></span>Glaciers</li></ul>';
  }

  /* ------------------------------------------------------------ switching */

  var tabs = $$('.tabs [role="tab"]');

  function setMap(n, skipHash) {
    state.map = n;
    state.sel = null;
    state.hot = null;
    app.dataset.map = n;
    tabs.forEach(function (t) {
      var on = Number(t.dataset.map) === n;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    story.setAttribute("aria-labelledby", "tab-" + n);
    story.innerHTML = n === 1 ? story1() : n === 2 ? story2() : story3();
    story.scrollTop = 0;
    legend.innerHTML = "<summary>Legend</summary>" + legendHTML(n);
    hideTip();
    applyMap();
    if (map.loaded() || map.getLayer("glaciers")) flyHome();
    if (!skipHash && window.history && history.replaceState) history.replaceState(null, "", "#map=" + n);
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { setMap(Number(t.dataset.map)); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      setMap(Number(next.dataset.map));
    });
  });

  story.addEventListener("click", function (e) {
    var row = e.target.closest(".row");
    if (row) select(row.dataset.kind, row.dataset.id, false);
  });
  story.addEventListener("mouseover", function (e) {
    var row = e.target.closest(".row");
    if (row) setHot(row.dataset.kind, row.dataset.id);
  });
  story.addEventListener("mouseleave", function () { setHot(null); });
  story.addEventListener("focusin", function (e) {
    var row = e.target.closest(".row");
    if (row) setHot(row.dataset.kind, row.dataset.id);
  });

  $("#btn-reset").addEventListener("click", function () {
    state.sel = null;
    $$(".row", story).forEach(function (row) {
      row.setAttribute("aria-expanded", "false");
      var d = row.parentNode.querySelector(".detail");
      if (d) d.hidden = true;
    });
    highlight();
    flyHome();
  });

  function flyHome() {
    var v = homeView(state.map);
    map.flyTo({ center: v.center, zoom: v.zoom, duration: reduceMotion ? 0 : 1200, essential: true });
  }

  var btnProj = $("#btn-proj"), isGlobe = true;
  btnProj.addEventListener("click", function () {
    isGlobe = !isGlobe;
    btnProj.textContent = isGlobe ? "Flat map" : "Globe";
    map.setProjection({ type: isGlobe ? "globe" : "mercator" });
  });

  if (window.matchMedia("(max-width: 860px)").matches) legend.removeAttribute("open");

  var m = /map=([123])/.exec(location.hash);
  setMap(m ? Number(m[1]) : 1, true);
  window.addEventListener("hashchange", function () {
    var h = /map=([123])/.exec(location.hash);
    if (h && Number(h[1]) !== state.map) setMap(Number(h[1]), true);
  });

  window.__iceToWater = { map: map, setMap: setMap, select: select };
})();
