"""MIZAN demo-data generator — runnable NOW, zero GEE, zero deps.

Generates physically plausible, SEEDED, clearly-labeled demo data so the
backend + dashboard work end-to-end before the first real GEE export
(rule UI-13: every demo artifact carries demo=true; never mock-as-real).

    python geo/run_pipeline.py --demo

Outputs (data/demo/):
  fields_demo.geojson        suspected-field polygons (Azraq cluster +
                             small clusters near 3 enforcement sites so the
                             P7 mechanic can be demonstrated honestly)
  basins_demo.geojson        3 basins; REAL stress % (MWI 2009 via IWMI),
                             simplified display geometry (labeled)
  tws_series_demo.json       GRACE-shaped TWS decline 2002->2024-09 incl.
                             the 2017-07..2018-05 GRACE->GRACE-FO gap
  forecast_demo.json         P6 forecast (fallback engine) + critical month
  validation_summary_demo.json  P7 run on the demo fields
"""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

import config as C
import p6_grace_forecast as p6
import p7_validation as p7

SEED = 215  # Azraq abstraction = 215% of safe yield (MWI 2009 via IWMI)
rng = random.Random(SEED)

ROOT = Path(__file__).resolve().parent.parent
DEMO = ROOT / "data" / "demo"

DEMO_STAMP_AR = "بيانات تجريبية — demo data"
DEMO_STAMP_EN = "demo data - replace with GEE export"


# ------------------------------------------------------------- fields -----
def _square(lon: float, lat: float, area_ha: float) -> list[list[list[float]]]:
    side_m = math.sqrt(area_ha * 10_000)
    dlat = side_m / 111_320
    dlon = side_m / (111_320 * math.cos(math.radians(lat)))
    return [[
        [lon - dlon / 2, lat - dlat / 2],
        [lon + dlon / 2, lat - dlat / 2],
        [lon + dlon / 2, lat + dlat / 2],
        [lon - dlon / 2, lat + dlat / 2],
        [lon - dlon / 2, lat - dlat / 2],
    ]]


def _ndvi_series(irrigated: bool) -> list[dict]:
    """Monthly NDVI 2024-01..2025-12 — summer-green only if irrigated."""
    out = []
    for y in (2024, 2025):
        for m in range(1, 13):
            if irrigated:
                base = 0.18 + 0.38 * math.exp(-((m - 7) ** 2) / 6.0)  # Jun–Aug peak
            else:
                base = 0.10 + 0.05 * math.exp(-((m - 3) ** 2) / 4.0)  # spring blush
            out.append({"month": f"{y}-{m:02d}", "ndvi": round(base + rng.uniform(-0.02, 0.02), 3)})
    return out


def _score(first_seen: int, area_ha: float, expansion: float, dist_n: float,
           zero_rain: int = 1, inside: int = 1) -> tuple[int, dict]:
    w = C.SCORE_WEIGHTS
    comp = {
        "inside_protected_basin": inside,
        "is_new_after_closure": 1 if first_seen >= C.NEW_AFTER_YEAR else 0,
        "active_in_zero_rain_months": zero_rain,
        "distance_to_nearest_licensed_well": round(dist_n, 2),
        "area_ha": round(min(area_ha / 40.0, 1.0), 2),
        "expansion_rate": round(min(expansion / 0.5, 1.0), 2),
    }
    score = round(sum(w[k] * v for k, v in comp.items()))
    return min(score, 100), comp


def _mk_field(i: int, lon: float, lat: float, basin: str, forced_green=False) -> dict:
    area = round(rng.uniform(1.5, 38.0), 1)
    first_seen = rng.choices(
        [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
        weights=[15, 14, 12, 10, 9, 8, 7, 6, 5, 4],
    )[0]
    expansion = round(rng.uniform(0, 0.45), 2) if rng.random() < 0.35 else 0.0
    dist_n = rng.uniform(0.2, 1.0)
    zero_rain, inside = (0, 0) if forced_green else (1, 1)
    score, comp = _score(first_seen, area, expansion, dist_n, zero_rain, inside)
    return {
        "type": "Feature",
        "properties": {
            "id": f"AZ-{i:03d}" if basin == "azraq" else f"VX-{i:03d}",
            "basin": basin,
            "area_ha": area,
            "first_seen_year": first_seen,
            "is_new": first_seen >= C.NEW_AFTER_YEAR,
            "is_expanding": expansion > C.EXPANDING_RATE,
            "expansion_rate": expansion,
            "score": score,
            "score_components": comp,
            "est_m3yr": int(area * C.M3_PER_HA_MID),
            "est_m3yr_low": int(area * C.M3_PER_HA_LOW),
            "est_m3yr_high": int(area * C.M3_PER_HA_HIGH),
            "method": "A (area x 6,000-9,000 m3/ha/yr; midpoint 7,500 displayed)",
            "status": rng.choices(["new", "inspected", "confirmed", "cleared"],
                                  weights=[78, 10, 7, 5])[0],
            "ndvi_series": _ndvi_series(not forced_green),
            "verified_true": None,  # filled by inspectors (P7 precision@20)
            "demo": True,
        },
        "geometry": {"type": "Polygon", "coordinates": _square(lon, lat, area)},
    }


def gen_fields() -> dict:
    feats = []
    # Azraq farm belt: clusters N/NE of the oasis (36.78–37.08, 31.78–32.12)
    centers = [(36.83, 31.90), (36.95, 32.02), (37.04, 31.86), (36.78, 32.08)]
    i = 1
    for cx, cy in centers:
        for _ in range(12):
            lon = cx + rng.uniform(-0.05, 0.05)
            lat = cy + rng.uniform(-0.04, 0.04)
            feats.append(_mk_field(i, lon, lat, "azraq")); i += 1
    # a few deliberate greens (excluded by rules) for honest variety
    for _ in range(4):
        lon = 36.6 + rng.uniform(-0.05, 0.05)
        lat = 31.62 + rng.uniform(-0.03, 0.03)
        feats.append(_mk_field(i, lon, lat, "azraq", forced_green=True)); i += 1
    # small clusters near 3 enforcement sites => P7 mechanic demo
    for site_lon, site_lat in [(35.625, 31.84), (36.07, 31.60), (36.21, 30.305)]:
        for _ in range(3):
            lon = site_lon + rng.uniform(-0.02, 0.02)
            lat = site_lat + rng.uniform(-0.02, 0.02)
            f = _mk_field(i, lon, lat, "national"); i += 1
            f["properties"]["score"] = max(f["properties"]["score"], 75)  # red
            feats.append(f)
    return {
        "type": "FeatureCollection",
        "name": "mizan_fields_demo",
        "properties": {"demo": True, "label_ar": DEMO_STAMP_AR,
                       "label_en": DEMO_STAMP_EN, "seed": SEED},
        "features": feats,
    }


# ------------------------------------------------------------- basins -----
def gen_basins() -> dict:
    geom = {
        "azraq": [[36.45, 31.55], [37.30, 31.55], [37.30, 32.25], [36.45, 32.25]],
        "amman_zarqa": [[35.75, 31.85], [36.45, 31.85], [36.45, 32.40], [35.75, 32.40]],
        "yarmouk": [[35.65, 32.40], [36.40, 32.40], [36.40, 32.75], [35.65, 32.75]],
    }
    feats = []
    for bid, meta in C.BASINS.items():
        ring = geom[bid] + [geom[bid][0]]
        feats.append({
            "type": "Feature",
            "properties": {
                "id": bid, "name_ar": meta["name_ar"], "name_en": meta["name_en"],
                "stress_pct": meta["stress_pct"],
                "stress_source": "MWI 2009 via IWMI (verified)",
                "geometry_note": "simplified display geometry — replace with HydroSHEDS/BGR",
                "demo_geometry": True,
            },
            "geometry": {"type": "Polygon", "coordinates": [ring]},
        })
    return {"type": "FeatureCollection", "name": "mizan_basins_demo",
            "properties": {"demo": True, "label_ar": DEMO_STAMP_AR,
                           "label_en": DEMO_STAMP_EN},
            "features": feats}


# ---------------------------------------------------------------- TWS -----
def gen_tws() -> dict:
    """GRACE-shaped regional decline, ~-1.4 cm/yr + seasonality, with the
    real 2017-07..2018-05 inter-mission gap left empty (shown transparently)."""
    series = []
    start, end = (2002, 4), (2024, 9)
    gap_lo, gap_hi = "2017-07", "2018-05"
    t = 0
    y, m = start
    while (y, m) <= end:
        ym = f"{y}-{m:02d}"
        if not (gap_lo <= ym <= gap_hi):
            trend = 6.0 - 1.4 * (t / 12.0)            # cm LWE
            seasonal = 2.3 * math.sin(2 * math.pi * (m - 3) / 12.0)
            series.append({"month": ym,
                           "anomaly_cm": round(trend + seasonal + rng.uniform(-0.8, 0.8), 2)})
        t += 1
        m += 1
        if m == 13:
            y, m = y + 1, 1
    return {
        "demo": True, "label_ar": DEMO_STAMP_AR, "label_en": DEMO_STAMP_EN,
        "band": C.GRACE_BAND, "units": "cm LWE anomaly",
        "dataset": C.GRACE_MASCON,
        "region_phrase_ar": "منحنى GRACE للأردن/المنطقة الشرقية — إشارة إقليمية",
        "region_phrase_en": "GRACE curve for Jordan / the eastern region - a regional signal",
        "gap": [gap_lo, gap_hi],
        "series": series,
    }


# ---------------------------------------------------------------- main ----
def main() -> None:
    DEMO.mkdir(parents=True, exist_ok=True)

    fields = gen_fields()
    (DEMO / "fields_demo.geojson").write_text(
        json.dumps(fields, ensure_ascii=False), encoding="utf-8")

    basins = gen_basins()
    (DEMO / "basins_demo.geojson").write_text(
        json.dumps(basins, ensure_ascii=False), encoding="utf-8")

    tws = gen_tws()
    (DEMO / "tws_series_demo.json").write_text(
        json.dumps(tws, ensure_ascii=False), encoding="utf-8")

    fc = p6.forecast(tws["series"])
    fc["demo"] = True
    (DEMO / "forecast_demo.json").write_text(
        json.dumps(fc, ensure_ascii=False), encoding="utf-8")

    sites = json.loads((ROOT / "data" / "validation_sites.geojson").read_text(encoding="utf-8"))
    val = p7.run(fields, sites)
    (DEMO / "validation_summary_demo.json").write_text(
        json.dumps(val, ensure_ascii=False), encoding="utf-8")

    n_red = sum(1 for f in fields["features"] if f["properties"]["score"] >= C.SCORE_RED)
    print(f"fields: {len(fields['features'])} (red {n_red}) | "
          f"tws: {len(tws['series'])} months | "
          f"critical: {fc['critical_month']} | "
          f"P7: {val['sites_covered']}/{val['sites_total']}")


if __name__ == "__main__":
    main()
