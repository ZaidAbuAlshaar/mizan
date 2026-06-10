"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useI18n } from "@/lib/i18n";
import type { FeatureCollection } from "@/lib/types";

// mapcn-style map (mapcn.dev): MapLibre GL + free CARTO dark basemap (no API
// key), shadcn-styled controls and popups. Field points are a data-driven GL
// layer (fast for hundreds of points); red ≥70 markers pulse like an alert.
const EMPTY = { type: "FeatureCollection", features: [] };

const STYLE: any = {
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, © CARTO",
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#050505" } },
    { id: "carto", type: "raster", source: "carto", paint: { "raster-opacity": 0.88 } },
  ],
};

const SCORE_COLOR: any = ["step", ["get", "score"], "#00FFB2", 40, "#FFB547", 70, "#FF5A5A"];
const BASIN_COLOR: any = ["step", ["get", "stress_pct"], "#00FFB2", 100, "#FFB547", 150, "#FF5A5A"];

function centroid(geom: any): [number, number] {
  if (geom.type === "Point") return geom.coordinates;
  const ring = geom.coordinates[0];
  let x = 0, y = 0;
  for (const p of ring) { x += p[0]; y += p[1]; }
  return [x / ring.length, y / ring.length];
}

function points(fc: FeatureCollection) {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => ({
      type: "Feature",
      properties: {
        id: f.properties.id, score: f.properties.score, basin: f.properties.basin,
        area_ha: f.properties.area_ha, first_seen_year: f.properties.first_seen_year,
        status: f.properties.status,
      },
      geometry: { type: "Point", coordinates: centroid(f.geometry) },
    })),
  };
}

function bboxOf(fc: FeatureCollection): maplibregl.LngLatBoundsLike | null {
  let minx = 180, miny = 90, maxx = -180, maxy = -90, seen = false;
  const walk = (c: any) => {
    if (typeof c[0] === "number") {
      seen = true;
      minx = Math.min(minx, c[0]); miny = Math.min(miny, c[1]);
      maxx = Math.max(maxx, c[0]); maxy = Math.max(maxy, c[1]);
    } else c.forEach(walk);
  };
  fc.features.forEach((f) => walk((f.geometry as any).coordinates));
  return seen ? [[minx, miny], [maxx, maxy]] : null;
}

export default function MapView({
  fields,
  basins,
  focus,
  yearFilter,
  legend = true,
  height = "100%",
}: {
  fields: FeatureCollection;
  basins?: FeatureCollection;
  focus?: FeatureCollection | null;
  yearFilter?: number;
  legend?: boolean;
  height?: string | number;
}) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map>();
  const raf = useRef<number>();
  const loaded = useRef(false);
  const fieldsRef = useRef(fields);
  const basinsRef = useRef(basins);
  const yearRef = useRef(yearFilter);
  const langRef = useRef(lang);
  fieldsRef.current = fields;
  basinsRef.current = basins;
  yearRef.current = yearFilter;
  langRef.current = lang;

  function applyYear(m: maplibregl.Map) {
    const y = yearRef.current;
    const yf: any = y == null ? true : ["<=", ["get", "first_seen_year"], y];
    if (m.getLayer("field-pts")) m.setFilter("field-pts", y == null ? null : yf);
    if (m.getLayer("field-glow")) m.setFilter("field-glow", y == null ? null : yf);
    if (m.getLayer("field-pulse"))
      m.setFilter("field-pulse", ["all", [">=", ["get", "score"], 70], yf] as any);
  }

  useEffect(() => {
    if (!ref.current || map.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: [36.6, 31.4],
      zoom: 6.2,
      attributionControl: { compact: true },
      preserveDrawingBuffer: true,
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    m.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: "metric" }), "bottom-left");
    map.current = m;

    m.on("load", () => {
      m.addSource("basins", { type: "geojson", data: (basinsRef.current ?? EMPTY) as any });
      m.addLayer({
        id: "basin-fill", type: "fill", source: "basins",
        paint: { "fill-color": BASIN_COLOR, "fill-opacity": 0.14 },
      });
      m.addLayer({
        id: "basin-line", type: "line", source: "basins",
        paint: { "line-color": "#00D9FF", "line-width": 1, "line-opacity": 0.4 },
      });
      m.addSource("fields", { type: "geojson", data: points(fieldsRef.current) as any });
      // pulsing alert ring under the dots (red ≥70)
      m.addLayer({
        id: "field-pulse", type: "circle", source: "fields",
        filter: [">=", ["get", "score"], 70],
        paint: { "circle-color": "#FF5A5A", "circle-opacity": 0, "circle-radius": 6 },
      });
      m.addLayer({
        id: "field-glow", type: "circle", source: "fields",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 6, 11, 14],
          "circle-color": SCORE_COLOR, "circle-opacity": 0.16, "circle-blur": 0.6,
        },
      });
      m.addLayer({
        id: "field-pts", type: "circle", source: "fields",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3.2, 11, 8],
          "circle-color": SCORE_COLOR,
          "circle-stroke-color": "#050505", "circle-stroke-width": 1.2, "circle-opacity": 0.96,
        },
      });
      loaded.current = true;
      applyYear(m);

      const t0 = performance.now();
      const tick = () => {
        if (!map.current || !map.current.getLayer("field-pulse")) return;
        const p = ((performance.now() - t0) % 1600) / 1600;
        map.current.setPaintProperty("field-pulse", "circle-radius", 5 + p * 18);
        map.current.setPaintProperty("field-pulse", "circle-opacity", 0.45 * (1 - p));
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);

      m.on("click", "field-pts", (e) => {
        const pr: any = e.features?.[0]?.properties;
        if (!pr) return;
        const ar = langRef.current === "ar";
        const coords = (e.features![0].geometry as any).coordinates.slice();
        const col = pr.score >= 70 ? "#FF5A5A" : pr.score >= 40 ? "#FFB547" : "#00FFB2";
        new maplibregl.Popup({ offset: 12, closeButton: true })
          .setLngLat(coords)
          .setHTML(
            `<div style="display:flex;flex-direction:column;gap:5px;min-width:172px">
               <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
                 <b style="font-size:13px">${pr.id}</b>
                 <span style="background:${col}22;color:${col};border-radius:6px;padding:1px 7px;font-weight:700">${Math.round(pr.score)}</span>
               </div>
               <div style="color:#A3AAB8;font-size:11px">
                 ${ar ? "المساحة" : "Area"}: ${pr.area_ha} ha · ${ar ? "أول ظهور" : "First seen"}: ${pr.first_seen_year}
               </div>
               <a href="/field/${encodeURIComponent(pr.id)}"
                  style="color:#00D9FF;font-size:12px;text-decoration:none;border:1px solid #232834;border-radius:8px;padding:4px 8px;text-align:center">
                 ${ar ? "افتح الدليل ←" : "Open evidence →"}
               </a>
             </div>`
          )
          .addTo(m);
      });
      m.on("mouseenter", "field-pts", () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", "field-pts", () => (m.getCanvas().style.cursor = ""));
    });

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      m.remove();
      map.current = undefined;
      loaded.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded.current) return;
    (m.getSource("fields") as maplibregl.GeoJSONSource | undefined)?.setData(points(fields) as any);
  }, [fields]);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded.current || !basins) return;
    (m.getSource("basins") as maplibregl.GeoJSONSource | undefined)?.setData(basins as any);
  }, [basins]);

  useEffect(() => {
    const m = map.current;
    if (m && loaded.current) applyYear(m);
  }, [yearFilter]);

  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    const bb = bboxOf(focus);
    if (bb) m.fitBounds(bb, { padding: 64, duration: 900, maxZoom: 11 });
  }, [focus]);

  return (
    <div style={{ height, width: "100%" }} className="relative overflow-hidden rounded-xl border border-line">
      <div ref={ref} className="absolute inset-0" />
      {legend && (
        <div className="pointer-events-none absolute bottom-2 end-2 rounded-lg border border-line bg-bg/85 px-3 py-2 text-[11px] backdrop-blur">
          <div className="mb-1 font-head font-bold text-muted">{t("legend")}</div>
          <div className="space-y-0.5">
            <div>🔴 {t("legend_red")}</div>
            <div>🟠 {t("legend_amber")}</div>
            <div>🟢 {t("legend_green")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
