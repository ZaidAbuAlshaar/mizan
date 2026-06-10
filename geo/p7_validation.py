"""MIZAN P7 — the credibility weapon. Pure-local, zero GEE.

Flags x validation_sites -> "X of Y enforcement sites fall inside our red
zones" + precision@20 for the queue. Works on demo or real exports alike:

    python geo/p7_validation.py \
        --fields data/demo/fields_demo.geojson \
        --sites data/validation_sites.geojson
"""
from __future__ import annotations

import argparse
import json
import math

RED_SCORE = 70
COVER_KM = 5.0  # site counts as covered if a red field lies within this radius


def haversine_km(lon1, lat1, lon2, lat2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def centroid(geom) -> tuple[float, float]:
    if geom["type"] == "Point":
        return tuple(geom["coordinates"])
    ring = geom["coordinates"][0]
    lon = sum(p[0] for p in ring) / len(ring)
    lat = sum(p[1] for p in ring) / len(ring)
    return lon, lat


def run(fields_fc: dict, sites_fc: dict, red=RED_SCORE, radius_km=COVER_KM) -> dict:
    fields = fields_fc.get("features", [])
    red_pts = [
        centroid(f["geometry"])
        for f in fields
        if float(f["properties"].get("score", 0)) >= red
    ]
    rows = []
    covered = 0
    for s in sites_fc.get("features", []):
        slon, slat = s["geometry"]["coordinates"]
        dmin = min(
            (haversine_km(slon, slat, lon, lat) for lon, lat in red_pts),
            default=float("inf"),
        )
        hit = dmin <= radius_km
        covered += hit
        rows.append(
            {
                "id": s["properties"]["id"],
                "name_ar": s["properties"]["name_ar"],
                "name_en": s["properties"]["name_en"],
                "date": s["properties"]["date"],
                "nearest_red_km": None if dmin == float("inf") else round(dmin, 1),
                "covered": hit,
            }
        )

    top20 = sorted(
        fields, key=lambda f: -float(f["properties"].get("score", 0))
    )[:20]
    # precision@20 needs labels; during the event, inspectors/labels fill
    # `verified_true`. With demo data we report it as null, not a fake number.
    labeled = [f for f in top20 if f["properties"].get("verified_true") is not None]
    p_at_20 = (
        round(
            sum(1 for f in labeled if f["properties"]["verified_true"]) / len(labeled),
            2,
        )
        if labeled
        else None
    )
    demo = bool(fields_fc.get("properties", {}).get("demo", False))
    return {
        "demo": demo,
        "sites_total": len(rows),
        "sites_covered": covered,
        "statement_ar": f"{covered} من {len(rows)} مواقع إنفاذ حقيقية تقع داخل مناطقنا الحمراء"
        + (" (بيانات تجريبية)" if demo else ""),
        "statement_en": f"{covered} of {len(rows)} real enforcement sites fall inside our red zones"
        + (" (demo data)" if demo else ""),
        "radius_km": radius_km,
        "precision_at_20": p_at_20,
        "rows": rows,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--fields", required=True)
    ap.add_argument("--sites", default="data/validation_sites.geojson")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    res = run(
        json.load(open(args.fields, encoding="utf-8")),
        json.load(open(args.sites, encoding="utf-8")),
    )
    text = json.dumps(res, ensure_ascii=False, indent=2)
    if args.out:
        open(args.out, "w", encoding="utf-8").write(text)
    print(text)
