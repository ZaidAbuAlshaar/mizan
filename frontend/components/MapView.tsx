"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useI18n } from "@/lib/i18n";
import type { FeatureCollection } from "@/lib/types";

const EMPTY = { type: "FeatureCollection", features: [] };

const STYLE: any = {
  version: 8,
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
    { id: "bg", type: "background", paint: { "background-color": "#0a0f1e" } },
    { id: "carto", type: "raster", source: "carto", paint: { "raster-opacity": 0.85 } },
  ],
};

const SCORE_COLOR: any = [
  "step",
  ["get", "score"],
  "#22c55e",
  40,
  "#f59e0b",
  70,
  "#ef4444",
];
const BASIN_COLOR: any = [
  "step",
  ["get", "stress_pct"],
  "#22c55e",
  100,
  "#f59e0b",
  150,
  "#ef4444",
];

function centroid(geom: any): [number, number] {
  if (geom.type === "Point") return geom.coordinates;
  const ring = geom.coordinates[0];
  let x = 0,
    y = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
  }
  return [x / ring.length, y / ring.length];
}

function points(fc: FeatureCollection) {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => ({
      type: "Feature",
      properties: {
        id: f.properties.id,
        score: f.properties.score,
        basin: f.properties.basin,
        area_ha: f.properties.area_ha,
        first_seen_year: f.properties.first_seen_year,
        status: f.properties.status,
      },
      geometry: { type: "Point", coordinates: centroid(f.geometry) },
    })),
  };
}

function bboxOf(fc: FeatureCollection): maplibregl.LngLatBoundsLike | null {
  let minx = 180,
    miny = 90,
    maxx = -180,
    maxy = -90,
    seen = false;
  const walk = (c: any) => {
    if (typeof c[0] === "number") {
      seen = true;
      minx = Math.min(minx, c[0]);
      miny = Math.min(miny, c[1]);
      maxx = Math.max(maxx, c[0]);
      maxy = Math.max(maxy, c[1]);
    } else c.forEach(walk);
  };
  fc.features.forEach((f) => walk((f.geometry as any).coordinates));
  return seen
    ? [
        [minx, miny],
        [maxx, maxy],
      ]
    : null;
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
  /** show only fields with first_seen_year <= yearFilter (time machine) */
  yearFilter?: number;
  legend?: boolean;
  height?: string | number;
}) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map>();
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
    if (!m.getLayer("field-pts")) return;
    const y = yearRef.current;
    m.setFilter(
      "field-pts",
      y == null ? null : (["<=", ["get", "first_seen_year"], y] as any)
    );
  }

  useEffect(() => {
    if (!ref.current || map.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: [36.6, 31.4],
      zoom: 6.2,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.current = m;

    m.on("load", () => {
      m.addSource("basins", {
        type: "geojson",
        data: (basinsRef.current ?? EMPTY) as any,
      });
      m.addLayer({
        id: "basin-fill",
        type: "fill",
        source: "basins",
        paint: { "fill-color": BASIN_COLOR, "fill-opacity": 0.14 },
      });
      m.addLayer({
        id: "basin-line",
        type: "line",
        source: "basins",
        paint: { "line-color": "#2dd4bf", "line-width": 1, "line-opacity": 0.4 },
      });
      m.addSource("fields", {
        type: "geojson",
        data: points(fieldsRef.current) as any,
      });
      // soft halo under the dots
      m.addLayer({
        id: "field-glow",
        type: "circle",
        source: "fields",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 6, 11, 14],
          "circle-color": SCORE_COLOR,
          "circle-opacity": 0.18,
          "circle-blur": 0.6,
        },
      });
      m.addLayer({
        id: "field-pts",
        type: "circle",
        source: "fields",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 11, 8],
          "circle-color": SCORE_COLOR,
          "circle-stroke-color": "#0a0f1e",
          "circle-stroke-width": 1,
          "circle-opacity": 0.95,
        },
      });
      loaded.current = true;
      applyYear(m);

      m.on("click", "field-pts", (e) => {
        const p: any = e.features?.[0]?.properties;
        if (!p) return;
        const ar = langRef.current === "ar";
        const coords = (e.features![0].geometry as any).coordinates.slice();
        new maplibregl.Popup({ offset: 10 })
          .setLngLat(coords)
          .setHTML(
            `<div style="display:flex;flex-direction:column;gap:4px">
               <div style="display:flex;justify-content:space-between;gap:10px">
                 <b>${p.id}</b>
                 <b style="color:${p.score >= 70 ? "#ef4444" : p.score >= 40 ? "#f59e0b" : "#22c55e"}">${Math.round(p.score)}</b>
               </div>
               <div style="color:#94a4c6;font-size:11px">
                 ${ar ? "المساحة" : "Area"}: ${p.area_ha} ha ·
                 ${ar ? "أول ظهور" : "First seen"}: ${p.first_seen_year}
               </div>
               <a href="/queue?sel=${encodeURIComponent(p.id)}"
                  style="color:#2dd4bf;font-size:12px;text-decoration:underline">
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
      m.remove();
      map.current = undefined;
      loaded.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded.current) return;
    (m.getSource("fields") as maplibregl.GeoJSONSource | undefined)?.setData(
      points(fields) as any
    );
  }, [fields]);

  useEffect(() => {
    const m = map.current;
    if (!m || !loaded.current || !basins) return;
    (m.getSource("basins") as maplibregl.GeoJSONSource | undefined)?.setData(
      basins as any
    );
  }, [basins]);

  useEffect(() => {
    const m = map.current;
    if (m && loaded.current) applyYear(m);
  }, [yearFilter]);

  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    const bb = bboxOf(focus);
    if (bb) m.fitBounds(bb, { padding: 60, duration: 800, maxZoom: 11 });
  }, [focus]);

  return (
    <div
      style={{ height, width: "100%" }}
      className="relative overflow-hidden rounded-xl border border-line"
    >
      <div ref={ref} className="absolute inset-0" />
      {legend && (
        <div className="pointer-events-none absolute bottom-2 start-2 rounded-lg border border-line bg-bg/85 px-3 py-2 text-[11px] backdrop-blur">
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
