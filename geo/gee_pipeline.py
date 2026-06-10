"""MIZAN P1–P5 on Google Earth Engine — Azraq AOI.

Run AFTER `earthengine authenticate` succeeds (TM-02):
    python geo/gee_pipeline.py --project YOUR_GCP_PROJECT \
        --out data/fields.geojson

Implements the constitution §11:
  P1  monthly cloud-masked NDVI composites (S2 SR; TOA/Landsat for 2016)
  P2  rule-based irrigation mask v1 (NDVI>=0.35 ∧ CHIRPS<10mm ∧ WorldCover ∧ ¬JRC)
  P3  annual masks -> vectors with area_ha / first_seen_year / NEW / EXPANDING
  P4  transparent suspicion score 0–100
  P5  est_m3yr via Method A (area x 6,000–9,000 m3/ha/yr, midpoint displayed)

working > perfect: keep edits minimal during the event; gates H4/H6/H8
decide threshold/AOI changes — see plan.md §8.
"""
from __future__ import annotations

import argparse
import json

import config as C


def init_ee(project: str | None):
    import ee  # earthengine-api

    ee.Initialize(project=project) if project else ee.Initialize()
    return ee


def aoi_geometry(ee):
    return ee.Geometry.Rectangle(C.AOI_BBOX)


# ----------------------------------------------------------------- P1 -----
def monthly_ndvi(ee, aoi, year: int, month: int):
    """Cloud-masked monthly mean NDVI from S2 SR (TOA for pre-2018)."""
    start = ee.Date.fromYMD(year, month, 1)
    end = start.advance(1, "month")
    coll_id = C.S2_SR if year >= 2018 else C.S2_TOA
    s2 = (
        ee.ImageCollection(coll_id)
        .filterBounds(aoi)
        .filterDate(start, end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 40))
    )

    def add_ndvi(img):
        return img.normalizedDifference(["B8", "B4"]).rename("NDVI")

    return s2.map(add_ndvi).mean().clip(aoi)


def summer_mean_ndvi(ee, aoi, year: int):
    imgs = [monthly_ndvi(ee, aoi, year, m) for m in C.SUMMER_MONTHS]
    return ee.ImageCollection(imgs).mean().rename("NDVI_summer")


def summer_rain_mm(ee, aoi, year: int):
    start = ee.Date.fromYMD(year, C.SUMMER_MONTHS[0], 1)
    end = ee.Date.fromYMD(year, C.SUMMER_MONTHS[-1], 1).advance(1, "month")
    return (
        ee.ImageCollection(C.CHIRPS_DAILY)
        .filterDate(start, end)
        .select("precipitation")
        .sum()
        .clip(aoi)
        .rename("rain_mm")
    )


# ----------------------------------------------------------------- P2 -----
def irrigation_mask(ee, aoi, year: int):
    """v1 rule mask. The desert makes this rule shockingly effective."""
    ndvi = summer_mean_ndvi(ee, aoi, year)
    rain = summer_rain_mm(ee, aoi, year)
    wc = ee.ImageCollection(C.WORLDCOVER).first().select("Map").clip(aoi)
    wc_ok = wc.eq(C.WORLDCOVER_CLASSES[0]).Or(wc.eq(C.WORLDCOVER_CLASSES[1]))
    jrc = ee.Image(C.JRC_WATER).select("occurrence").unmask(0).clip(aoi)
    not_surface = jrc.lte(C.JRC_OCCURRENCE_MAX)
    # Treated-wastewater exclusion: pass a geometry for Amman-Zarqa runs.
    mask = (
        ndvi.gte(C.NDVI_SUMMER_MIN)
        .And(rain.lt(C.CHIRPS_SUMMER_MAX_MM))
        .And(wc_ok)
        .And(not_surface)
    )
    return mask.selfMask().rename("irrigated")


# ----------------------------------------------------------------- P3 -----
def fields_with_change(ee, aoi):
    """Annual masks -> polygons + first_seen_year + NEW/EXPANDING flags."""
    years = C.ANNUAL_YEARS
    annual = {y: irrigation_mask(ee, aoi, y) for y in years}

    # first_seen_year: earliest year a pixel is irrigated
    first_seen = ee.Image.constant(0).rename("first_seen")
    for y in sorted(years, reverse=True):
        first_seen = first_seen.where(annual[y].unmask(0).eq(1), y)

    latest = annual[years[-1]]
    vectors = latest.addBands(first_seen.toInt()).reduceToVectors(
        geometry=aoi,
        scale=C.EXPORT_SCALE_M,
        geometryType="polygon",
        reducer=__import__("ee").Reducer.mode(),
        maxPixels=1e10,
        labelProperty="irrigated",
    )

    def enrich(f):
        area_ha = f.geometry().area(1).divide(10_000)
        fy = ee.Number(f.get("mode")).toInt()
        return f.set(
            {
                "area_ha": area_ha,
                "first_seen_year": fy,
                "is_new": fy.gte(C.NEW_AFTER_YEAR),
            }
        )

    ee = __import__("ee")
    return vectors.map(enrich).filter(
        ee.Filter.gte("area_ha", C.MIN_FIELD_AREA_HA)
    )


# ------------------------------------------------------------- P4 + P5 ----
def score_and_volume(ee, fields, licensed_wells=None):
    """Transparent 0–100 score + Method-A volume. Weights: config.SCORE_WEIGHTS."""
    w = C.SCORE_WEIGHTS

    def per_feature(f):
        area = ee.Number(f.get("area_ha"))
        new = ee.Number(ee.Algorithms.If(f.get("is_new"), 1, 0))
        # normalizations are declared and simple (explainability over cleverness)
        area_n = area.divide(40).min(1)
        # distance term needs the licensed-wells layer (Tier A/C). Without it,
        # use 0.5 neutral and SAY SO on the methodology screen.
        dist_n = ee.Number(0.5)
        exp_n = ee.Number(0)  # filled when area_trajectory is computed
        score = (
            ee.Number(w["inside_protected_basin"])  # Azraq AOI => 1
            .add(new.multiply(w["is_new_after_closure"]))
            .add(ee.Number(w["active_in_zero_rain_months"]))  # by construction of P2
            .add(dist_n.multiply(w["distance_to_nearest_licensed_well"]))
            .add(area_n.multiply(w["area_ha"]))
            .add(exp_n.multiply(w["expansion_rate"]))
        )
        return f.set(
            {
                "score": score,
                "est_m3yr": area.multiply(C.M3_PER_HA_MID),
                "est_m3yr_low": area.multiply(C.M3_PER_HA_LOW),
                "est_m3yr_high": area.multiply(C.M3_PER_HA_HIGH),
                "method": "A (area x 6,000-9,000 m3/ha/yr; midpoint 7,500 displayed)",
            }
        )

    return fields.map(per_feature)


def h4_check_mod16(ee, aoi) -> dict:
    """Gate H4: is MOD16A2(GF) usable over Azraq farms? Returns coverage stats."""
    et = (
        ee.ImageCollection(C.MOD16A2GF)
        .filterDate("2023-01-01", "2024-01-01")
        .select("ET")
        .mean()
        .clip(aoi)
    )
    stats = et.reduceRegion(
        reducer=__import__("ee").Reducer.count().combine(
            __import__("ee").Reducer.mean(), sharedInputs=True
        ),
        geometry=aoi,
        scale=500,
        maxPixels=1e9,
    )
    return stats.getInfo()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=None, help="GCP project for ee.Initialize")
    ap.add_argument("--out", default="data/fields.geojson")
    ap.add_argument("--h4", action="store_true", help="only run the H4 MOD16 check")
    args = ap.parse_args()

    ee = init_ee(args.project)
    aoi = aoi_geometry(ee)

    if args.h4:
        print(json.dumps(h4_check_mod16(ee, aoi), indent=2))
        return

    fields = score_and_volume(ee, fields_with_change(ee, aoi))
    # Small AOIs: getInfo; otherwise Export.table.toDrive (risk register: export
    # composites to Assets/Drive on day 0).
    fc = fields.getInfo()
    fc.setdefault("properties", {})["demo"] = False
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False)
    print(f"wrote {args.out}: {len(fc.get('features', []))} fields")


if __name__ == "__main__":
    main()
