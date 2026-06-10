"""MIZAN backend data store.

Default: in-memory store loaded from data files — zero-dependency, works
NOW, and is exactly what the demo needs (working > perfect). Real GeoJSON
exports drop into data/ and take precedence over data/demo/ automatically.

PostGIS path (constitution §12): backend/schema.sql + backend/load_db.py;
switch by setting DATABASE_URL (see README) once the DB exists — H20+
hardening, not a demo prerequisite.
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
DEMO = DATA / "demo"
OVERRIDES = DEMO / "status_overrides.json"  # PATCH persistence for demo mode

VALID_STATUS = ("new", "inspected", "confirmed", "cleared")

# Verified numbers (plan.md Appendix A) — used by /impact/summary
PEOPLE_PER_MCM = 3730          # ministry equation: 42.9 MCM ≈ 160k people
DESAL_USD_LOW, DESAL_USD_HIGH = 0.5, 0.7   # declared optimistic floor
JOD_PER_USD = 0.709            # JOD peg
CARRIER_M3 = 300_000_000       # National Carrier annual production
NATIONAL_OVERDRAFT_M3 = 205_000_000


def _load(real: str, demo: str) -> dict:
    p = DATA / real
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return json.loads((DEMO / demo).read_text(encoding="utf-8"))


class Store:
    def __init__(self) -> None:
        self.reload()

    def reload(self) -> None:
        self.fields = _load("fields.geojson", "fields_demo.geojson")
        self.basins = _load("basins.geojson", "basins_demo.geojson")
        self.tws = _load("tws_series.json", "tws_series_demo.json")
        self.forecast_data = _load("forecast.json", "forecast_demo.json")
        self.sites = json.loads((DATA / "validation_sites.geojson").read_text(encoding="utf-8"))
        self.demo = bool(self.fields.get("properties", {}).get("demo", False))
        self._apply_overrides()

    # ------------------------------------------------------ overrides -----
    def _apply_overrides(self) -> None:
        if OVERRIDES.exists():
            ov = json.loads(OVERRIDES.read_text(encoding="utf-8"))
            for f in self.fields["features"]:
                fid = f["properties"]["id"]
                if fid in ov:
                    f["properties"]["status"] = ov[fid]

    def _save_override(self, fid: str, status: str) -> None:
        ov = json.loads(OVERRIDES.read_text(encoding="utf-8")) if OVERRIDES.exists() else {}
        ov[fid] = status
        OVERRIDES.parent.mkdir(parents=True, exist_ok=True)
        OVERRIDES.write_text(json.dumps(ov, ensure_ascii=False, indent=1), encoding="utf-8")

    # --------------------------------------------------------- fields -----
    def get_fields(self, basin: str | None = None, min_score: float | None = None,
                   status: str | None = None) -> dict:
        feats = self.fields["features"]
        if basin:
            feats = [f for f in feats if f["properties"].get("basin") == basin]
        if min_score is not None:
            feats = [f for f in feats if float(f["properties"].get("score", 0)) >= min_score]
        if status:
            feats = [f for f in feats if f["properties"].get("status") == status]
        return {
            "type": "FeatureCollection",
            "properties": {**self.fields.get("properties", {}), "count": len(feats)},
            "features": feats,
        }

    def get_field(self, fid: str) -> dict | None:
        for f in self.fields["features"]:
            if f["properties"]["id"] == fid:
                return f
        return None

    def set_status(self, fid: str, status: str) -> dict | None:
        if status not in VALID_STATUS:
            raise ValueError(f"status must be one of {VALID_STATUS}")
        f = self.get_field(fid)
        if f is None:
            return None
        f["properties"]["status"] = status
        self._save_override(fid, status)
        return f

    def alerts(self, limit: int = 20) -> list[dict]:
        feats = sorted(self.fields["features"],
                       key=lambda f: -float(f["properties"].get("score", 0)))[:limit]
        out = []
        for rank, f in enumerate(feats, 1):
            p = f["properties"]
            lon, lat = _centroid(f["geometry"])
            out.append({
                "rank": rank, "id": p["id"], "basin": p.get("basin"),
                "lat": round(lat, 5), "lon": round(lon, 5),
                "area_ha": p["area_ha"], "first_seen_year": p["first_seen_year"],
                "est_m3yr": p["est_m3yr"], "score": p["score"],
                "status": p["status"], "demo": p.get("demo", False),
            })
        return out

    # --------------------------------------------------------- basins -----
    def basin_list(self) -> dict:
        return self.basins

    def basin_health(self, bid: str) -> dict | None:
        for b in self.basins["features"]:
            if b["properties"]["id"] == bid:
                p = b["properties"]
                stress = p["stress_pct"]
                level = "red" if stress >= 150 else "amber" if stress >= 100 else "green"
                n_fields = sum(1 for f in self.fields["features"]
                               if f["properties"].get("basin") == bid)
                return {
                    "id": bid, "name_ar": p["name_ar"], "name_en": p["name_en"],
                    "stress_pct": stress, "stress_source": p.get("stress_source"),
                    "level": level, "suspected_fields": n_fields,
                    "demo": self.demo,
                }
        return None

    def basin_forecast(self, bid: str) -> dict:
        # GRACE is a REGIONAL signal (binding phrasing rule) — the same series
        # is served for any basin id with the regional phrase attached.
        return {
            "basin": bid,
            "tws": self.tws,
            "forecast": self.forecast_data,
            "demo": self.demo,
        }

    # --------------------------------------------------------- impact -----
    def impact(self) -> dict:
        red = [f["properties"] for f in self.fields["features"]
               if float(f["properties"].get("score", 0)) >= 70]
        m3 = sum(p["est_m3yr"] for p in red)
        usd_low, usd_high = m3 * DESAL_USD_LOW, m3 * DESAL_USD_HIGH
        return {
            "demo": self.demo,
            "red_fields": len(red),
            "recoverable_m3yr": m3,
            "people_equivalent": int(m3 / 1e6 * PEOPLE_PER_MCM),
            "usd_low": int(usd_low), "usd_high": int(usd_high),
            "jod_low": int(usd_low * JOD_PER_USD), "jod_high": int(usd_high * JOD_PER_USD),
            "carrier_share_pct": round(m3 / CARRIER_M3 * 100, 1),
            "national_overdraft_m3": NATIONAL_OVERDRAFT_M3,
            "methodology_ar": "تقديري: م³ (الحقول الحمراء) × كلفة تحلية بديلة 0.5–0.7$ — الحدّ الأدنى المتفائل؛ تعرفة الأردن المُوصَّلة ~2.7$. معادلة الأشخاص: 1 مليون م³ ≈ 3,730 شخصاً/سنة (معادلة الوزارة).",
            "methodology_en": "Estimate: m3 (red fields) x alternative desalination cost $0.5-0.7 (optimistic floor; Jordan's delivered tariff ~$2.7). People equation: 1M m3 ≈ 3,730 person-years (ministry equation).",
        }

    # ----------------------------------------------------- validation -----
    def validation(self) -> dict:
        import sys
        sys.path.insert(0, str(ROOT / "geo"))
        import p7_validation as p7
        return p7.run(self.fields, self.sites)


def _centroid(geom: dict) -> tuple[float, float]:
    if geom["type"] == "Point":
        return tuple(geom["coordinates"])
    ring = geom["coordinates"][0]
    return (sum(p[0] for p in ring) / len(ring),
            sum(p[1] for p in ring) / len(ring))


store = Store()
