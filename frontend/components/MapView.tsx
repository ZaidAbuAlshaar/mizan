"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection } from "@/lib/types";

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

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

function points(fc: FeatureCollection): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => ({
      type: "Feature",
      properties: {
        id: f.properties.id,
        score: f.properties.score,
        basin: f.properties.basin,
      },
      geometry: { type: "Point", coordinates: centroid(f.geometry) },
    })) as any,
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
  onSelect,
  focus,
  height = "100%",
}: {
  fields: FeatureCollection;
  basins?: FeatureCollection;
  onSelect?: (id: string) => void;
  focus?: FeatureCollection | null;
  height?: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map>();
  const fieldsRef = useRef(fields);
  const basinsRef = useRef(basins);
  fieldsRef.current = fields;
  basinsRef.current = basins;

  useEffect(() => {
    if (!ref.current || map.current) return;
    const m = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: [36.6, 31.4],
      zoom: 6.2,
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
      m.addLayer({
        id: "field-pts",
        type: "circle",
        source: "fields",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 11, 8],
          "circle-color": SCORE_COLOR,
          "circle-stroke-color": "#0a0f1e",
          "circle-stroke-width": 1,
          "circle-opacity": 0.92,
        },
      });
      m.on("click", "field-pts", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id && onSelect) onSelect(String(id));
      });
      m.on("mouseenter", "field-pts", () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", "field-pts", () => (m.getCanvas().style.cursor = ""));
    });
    return () => {
      m.remove();
      map.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    const s = m?.getSource("fields") as maplibregl.GeoJSONSource | undefined;
    if (s) s.setData(points(fields) as any);
  }, [fields]);

  useEffect(() => {
    const m = map.current;
    const s = m?.getSource("basins") as maplibregl.GeoJSONSource | undefined;
    if (s && basins) s.setData(basins as any);
  }, [basins]);

  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    const bb = bboxOf(focus);
    if (bb) m.fitBounds(bb, { padding: 60, duration: 800, maxZoom: 11 });
  }, [focus]);

  return (
    <div
      ref={ref}
      style={{ height, width: "100%" }}
      className="overflow-hidden rounded-xl border border-line"
    />
  );
}
