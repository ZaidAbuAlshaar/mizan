/* ============================================================
   MIZAN — LIVE extras: MapLibre national/basin map with NASA GIBS
   layers, real HLS imagery time machine + before/after, rainfall
   panel (NASA POWER). All real, no keys.
   ============================================================ */

const GIBS = {
  truecolor: { id: "VIIRS_SNPP_CorrectedReflectance_TrueColor", level: 9, ext: "jpg" },
  ndvi:      { id: "MODIS_Terra_NDVI_8Day", level: 8, ext: "png" },
  grace:     { id: "GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI", level: 6, ext: "png" },
};
function gibsTiles(k, date) {
  const g = GIBS[k];
  return [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${g.id}/default/${date}/GoogleMapsCompatible_Level${g.level}/{z}/{y}/{x}.${g.ext}`];
}
function dstr(d) { return d.toISOString().slice(0, 10); }
function latestDates() {
  const now = new Date(Date.now() - 2 * 864e5);                  // truecolor: 2 days back
  const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const doy = Math.floor((now - jan1) / 864e5);
  const p = new Date(jan1.getTime() + (Math.floor((doy - 8) / 8) * 8) * 864e5); // ndvi 8-day period start
  return { truecolor: dstr(now), ndvi: dstr(p), grace: "2024-06-16" };
}
function wvSnap({ layers, time, bbox, w = 760, h = 520 }) {
  return "https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot"
    + `&TIME=${time}&BBOX=${bbox.join(",")}&CRS=EPSG:4326&LAYERS=${layers}`
    + `&FORMAT=image/jpeg&WIDTH=${w}&HEIGHT=${h}`;
}
/* real summer imagery for a given year (HLS 30 m; L30 pre-2018, S30 after) */
function hlsYearUrl(year, bbox, w, h) {
  const layer = year <= 2017 ? "HLS_L30_Nadir_BRDF_Adjusted_Reflectance" : "HLS_S30_Nadir_BRDF_Adjusted_Reflectance";
  return wvSnap({ layers: layer, time: `${year}-08-15`, bbox, w, h });
}

/* ---------------- Data badge (REAL vs demo) ---------------- */
function RealBadge({ lang, small }) {
  const t = getT(lang);
  return (
    <span className="badge badge-real" style={small ? { fontSize: 10, padding: "3px 7px" } : null} title="real data">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M5 12l4.5 4.5L19 7" />
      </svg>
      {t.realData}
    </span>
  );
}
function DataBadge({ lang, small }) {
  return window.MIZAN_DATA.__real ? <RealBadge lang={lang} small={small} /> : <DemoBadge lang={lang} small={small} />;
}

/* ---------------- LiveMap (MapLibre + NASA GIBS) ---------------- */
function LiveMap({ lang, layers, onField, onBasin, mode = "national", nasaLayer, nasaDate }) {
  const t = getT(lang);
  const box = useRef(null);
  const mapRef = useRef(null);
  const [err, setErr] = useState(false);
  const dates = useMemo(latestDates, []);

  useEffect(() => {
    if (!window.maplibregl || !box.current) { setErr(true); return; }
    const M = window.MIZAN_DATA;
    const map = new maplibregl.Map({
      container: box.current,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          carto: { type: "raster", tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"], tileSize: 256, attribution: "© OSM © CARTO" },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": "#0A1628" } },
          { id: "carto", type: "raster", source: "carto", paint: { "raster-opacity": 0.85 } },
        ],
      },
      center: mode === "basin" ? [36.85, 31.9] : [36.7, 31.45],
      zoom: mode === "basin" ? 8.6 : 6.4,
      minZoom: 5, maxZoom: 14,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), lang === "ar" ? "top-left" : "top-right");

    map.on("load", () => {
      /* NASA raster layers (toggleable) */
      ["truecolor", "ndvi", "grace"].forEach(k => {
        map.addSource("gibs-" + k, { type: "raster", tiles: gibsTiles(k, dates[k]), tileSize: 256, maxzoom: GIBS[k].level });
        map.addLayer({ id: "gibs-" + k, type: "raster", source: "gibs-" + k,
          paint: { "raster-opacity": k === "grace" ? 0.62 : 0.85 }, layout: { visibility: "none" } }, undefined);
      });

      /* approximate basin outlines (display) */
      const basinFC = { type: "FeatureCollection", features: M.basins.map(b => ({
        type: "Feature", properties: { id: b.id, status: b.status },
        geometry: { type: "Polygon", coordinates: [[...b.poly, b.poly[0]]] } })) };
      map.addSource("basins", { type: "geojson", data: basinFC });
      map.addLayer({ id: "basins-fill", type: "fill", source: "basins",
        paint: { "fill-color": ["match", ["get", "status"], "critical", "#EF4444", "#F59E0B"], "fill-opacity": 0.07 } });
      map.addLayer({ id: "basins-line", type: "line", source: "basins",
        paint: { "line-color": ["match", ["get", "status"], "critical", "#EF4444", "#F59E0B"], "line-width": 1.4, "line-dasharray": [3, 2], "line-opacity": 0.7 } });

      /* REAL detected fields */
      const pts = window.MIZAN_FIELDS_PTS || { type: "FeatureCollection", features: M.fields.map(f => ({
        type: "Feature", geometry: { type: "Point", coordinates: [f.lon, f.lat] },
        properties: { score: f.score || (f.grade === "critical" ? 80 : f.grade === "stressed" ? 55 : 20), rank: f.rank || 0, area_ha: f.area_ha || 0 } })) };
      map.addSource("fields-pts", { type: "geojson", data: pts });
      if (window.MIZAN_FIELDS_FC) {
        map.addSource("fields-poly", { type: "geojson", data: window.MIZAN_FIELDS_FC });
        map.addLayer({ id: "fields-poly", type: "fill", source: "fields-poly", minzoom: 9.5,
          paint: { "fill-color": ["step", ["get", "score"], "#10B981", 40, "#F59E0B", 70, "#EF4444"], "fill-opacity": 0.42 } });
        map.addLayer({ id: "fields-poly-line", type: "line", source: "fields-poly", minzoom: 9.5,
          paint: { "line-color": "#2DD4BF", "line-width": 0.8, "line-opacity": 0.8 } });
      }
      map.addLayer({ id: "fields-heat", type: "heatmap", source: "fields-pts", maxzoom: 11,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "score"], 0, 0.1, 100, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 5, 0.7, 10, 2.2],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 10, 10, 34],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)", 0.25, "rgba(45,212,191,.45)", 0.5, "rgba(245,158,11,.6)", 0.8, "rgba(239,68,68,.8)"],
          "heatmap-opacity": 0.8,
        } });
      map.addLayer({ id: "fields-dots", type: "circle", source: "fields-pts", minzoom: 7,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 2.5, 12, 7],
          "circle-color": ["step", ["get", "score"], "#10B981", 40, "#F59E0B", 70, "#EF4444"],
          "circle-stroke-color": "#0A1628", "circle-stroke-width": 1, "circle-opacity": 0.95,
        } });

      /* enforcement sites (published news, approximate) */
      if (M.validation) {
        map.addSource("sites", { type: "geojson", data: M.validation });
        map.addLayer({ id: "sites", type: "circle", source: "sites",
          paint: { "circle-radius": 6, "circle-color": "#22D3EE", "circle-stroke-color": "#fff", "circle-stroke-width": 1.4, "circle-opacity": 0.95 },
          layout: { visibility: layers && layers.sites === false ? "none" : "visible" } });
        map.on("click", "sites", e => {
          const p = e.features[0].properties;
          new maplibregl.Popup({ closeButton: false })
            .setLngLat(e.lngLat)
            .setHTML(`<div style="font-family:Tajawal;direction:rtl;min-width:170px">
              <b>${p.name_ar}</b> · ${p.date}<br><span style="opacity:.75">${p.note_ar || ""}</span>
              <div style="opacity:.6;font-size:11px;margin-top:4px">إحداثيات تقريبية لمركز المنطقة</div></div>`)
            .addTo(map);
        });
      }

      map.on("click", "fields-dots", e => {
        const p = e.features[0].properties;
        const html = `<div style="font-family:Tajawal;direction:rtl;min-width:180px">
          <b>موقع مرشَّح للتفتيش</b><br>
          الدرجة: <b>${p.score}</b> · المساحة: ${p.area_ha} هكتار<br>
          <span style="opacity:.7;font-size:11px">كشف حقيقي — Sentinel-2 صيف 2025</span></div>`;
        new maplibregl.Popup({ closeButton: false }).setLngLat(e.lngLat).setHTML(html).addTo(map);
        if (onField && p.rank && p.rank <= 20) onField({ rank: p.rank });
      });
      map.on("mouseenter", "fields-dots", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "fields-dots", () => (map.getCanvas().style.cursor = ""));
      map.on("click", "basins-fill", e => { if (onBasin && e.features.length) onBasin({ id: e.features[0].properties.id }); });

      if (mode === "national") map.fitBounds([[34.85, 29.15], [39.35, 33.45]], { padding: 26, duration: 0 });
      else map.fitBounds([[36.45, 31.55], [37.30, 32.25]], { padding: 18, duration: 0 });
      map.__ready = true;
      syncVisibility(map, layers, nasaLayer);
    });
    return () => map.remove();
  }, []);

  /* react to toggles */
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.__ready) syncVisibility(map, layers, nasaLayer);
  }, [layers, nasaLayer]);

  function syncVisibility(map, ly, nasa) {
    const v = (id, on) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    const L = ly || {};
    v("basins-fill", L.basins !== false); v("basins-line", L.basins !== false);
    v("fields-heat", L.heat !== false);
    v("fields-dots", L.dots !== false);
    v("fields-poly", L.dots !== false); v("fields-poly-line", L.dots !== false);
    v("sites", !!L.sites);
    ["truecolor", "ndvi", "grace"].forEach(k => v("gibs-" + k, nasa === k));
  }

  if (err || !window.maplibregl) {
    return <JordanMap lang={lang} layers={layers} onBasin={onBasin} onField={onField} />;
  }
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={box} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", bottom: 4, insetInlineEnd: 8, fontSize: 9.5, color: "var(--text-3)", direction: "ltr" }}>{t.basemap_note}</div>
    </div>
  );
}

/* ---------------- NASA layer picker chips ---------------- */
function NasaLayerPicker({ lang, value, onChange }) {
  const t = getT(lang);
  const opts = [["none", t.layer_none], ["truecolor", t.layer_truecolor], ["ndvi", t.layer_ndvi], ["grace", t.layer_grace]];
  return (
    <div className="hud-panel" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
      <div className="eyebrow" style={{ padding: "2px 6px", color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 6 }}>
        <span className="live-dot" />{t.liveNasa}
      </div>
      {opts.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: "var(--r-md)", cursor: "pointer", textAlign: "start",
            background: value === k ? "var(--accent-soft)" : "transparent",
            border: `1px solid ${value === k ? "var(--accent-line)" : "var(--line)"}`,
            color: value === k ? "var(--text)" : "var(--text-3)", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, transition: "all .15s" }}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Rainfall panel (NASA POWER — real) ---------------- */
function RainPanel({ lang }) {
  const t = getT(lang);
  const R = window.MIZAN_DATA.rain;
  if (!R || !R.series) return null;
  const months = R.series.slice(-36);
  const mx = Math.max(8, ...months.map(m => m.mm || 0));
  const W = 720, H = 150, m = { t: 16, r: 12, b: 26, l: 30 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const bw = iw / months.length;
  const summer = R.summer_sum_mm ? Object.values(R.summer_sum_mm)[0] : null;
  return (
    <div className="hud-panel ticked" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="drop" size={17} style={{ color: "var(--accent-2)" }} />
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15 }}>{t.rain_title}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{t.rain_sub}</div>
          </div>
        </div>
        <RealBadge lang={lang} small />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", direction: "ltr" }}>
        {[0, mx / 2, mx].map((v, i) => (
          <g key={i}>
            <line x1={m.l} y1={m.t + ih - (v / mx) * ih} x2={m.l + iw} y2={m.t + ih - (v / mx) * ih} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={m.l - 6} y={m.t + ih - (v / mx) * ih + 4} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="var(--font-num)">{Math.round(v)}</text>
          </g>
        ))}
        {months.map((mo, i) => {
          const v = mo.mm || 0;
          const isSummer = ["06", "07", "08"].includes(mo.ym.slice(4));
          return <rect key={mo.ym} x={m.l + i * bw + 1} y={m.t + ih - (v / mx) * ih}
            width={Math.max(2, bw - 2)} height={Math.max(0.5, (v / mx) * ih)}
            fill={isSummer ? "var(--danger)" : "var(--accent-2)"} opacity={isSummer ? 0.95 : 0.55} rx="1.5" />;
        })}
        {months.map((mo, i) => mo.ym.endsWith("01") ? (
          <text key={"x" + mo.ym} x={m.l + i * bw} y={H - 8} fontSize="9.5" fill="var(--text-3)" fontFamily="var(--font-num)">{mo.ym.slice(0, 4)}</text>
        ) : null)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontSize: 12 }}>
        <span style={{ color: "var(--text-2)" }}>{t.rain_summer} {Object.keys(R.summer_sum_mm || {})[0] || ""}:</span>
        <span className="num" style={{ fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 18, color: "var(--danger)" }}>
          {summer != null ? summer : "–"} mm
        </span>
      </div>
    </div>
  );
}

/* ---------------- Real-imagery year stack (time machine core) ---------------- */
function YearImagery({ year, bbox, w = 800, h = 450 }) {
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0A1020" }}>
      {years.map(y => (
        <img key={y} src={hlsYearUrl(y, bbox, w, h)} alt={"" + y} loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
            opacity: y === year ? 1 : 0, transition: "opacity .45s ease" }} />
      ))}
    </div>
  );
}

/* ---------------- Real before/after slider for a field ---------------- */
function SnapBeforeAfter({ lang, row }) {
  const t = getT(lang);
  const [pos, setPos] = useState(50);
  const wrap = useRef(null);
  const drag = useRef(false);
  const dx = 0.016, dy = 0.013;
  const bbox = [row.lat - dy, row.lon - dx, row.lat + dy, row.lon + dx];
  const before = hlsYearUrl(2017, bbox, 640, 480);
  const after = hlsYearUrl(2025, bbox, 640, 480);
  const move = clientX => {
    const r = wrap.current.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  };
  useEffect(() => {
    const mm = e => drag.current && move(e.touches ? e.touches[0].clientX : e.clientX);
    const mu = () => (drag.current = false);
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", mm); window.addEventListener("touchend", mu);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); window.removeEventListener("touchmove", mm); window.removeEventListener("touchend", mu); };
  }, []);
  const lbl = side => ({ position: "absolute", bottom: 10, [side]: 10, fontFamily: "var(--font-num)", fontSize: 11.5, fontWeight: 700, color: "#fff", background: "rgba(7,16,31,.7)", padding: "4px 9px", borderRadius: 999, border: "1px solid var(--line-strong)" });
  return (
    <div>
      <div ref={wrap} style={{ position: "relative", width: "100%", aspectRatio: "16/10", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)", userSelect: "none", direction: "ltr", background: "#0A1020" }}>
        <img src={after} alt="after" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={before} alt="before" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <span style={lbl("left")}>2017</span>
        <span style={lbl("right")}>2025</span>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "var(--accent)", transform: "translateX(-1px)", boxShadow: "0 0 10px var(--accent)" }}>
          <div onMouseDown={() => (drag.current = true)} onTouchStart={() => (drag.current = true)}
            style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize", color: "#042f2a", boxShadow: "0 2px 10px rgba(0,0,0,.5)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 7l-4 5 4 5M15 7l4 5-4 5" /></svg>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="layers" size={13} />{t.ev_ba_real} · GPS {row.gps}
      </div>
    </div>
  );
}

Object.assign(window, { LiveMap, NasaLayerPicker, RainPanel, YearImagery, SnapBeforeAfter, RealBadge, DataBadge, wvSnap, hlsYearUrl, latestDates });
