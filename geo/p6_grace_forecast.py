"""MIZAN P6 — GRACE/GRACE-FO TWS series + depletion forecast (Engine 3).

Two entry points:
  extract_tws(project)  -> monthly lwe_thickness (cm) over the AOI from
                           NASA/GRACE/MASS_GRIDS_V04/MASCON (needs GEE auth)
  forecast(series)      -> 60-month forecast + critical-threshold date.
                           Uses Prophet when installed; otherwise a
                           transparent linear-trend + seasonal fallback
                           (stdlib only — works everywhere).

Phrasing rule (binding, war plan §7.2): this is the GRACE curve for
"Jordan / the eastern region" — a REGIONAL signal. Never present it as a
single-basin or field-level measurement.
"""
from __future__ import annotations

import json
import math
from datetime import date

import config as C


def extract_tws(project: str | None = None) -> list[dict]:
    """Monthly mean lwe_thickness (cm) over the AOI. Requires GEE auth."""
    import ee

    ee.Initialize(project=project) if project else ee.Initialize()
    aoi = ee.Geometry.Rectangle(C.AOI_BBOX)
    coll = (
        ee.ImageCollection(C.GRACE_MASCON)
        .filterDate(C.GRACE_START, C.GRACE_END)
        .select(C.GRACE_BAND)
    )

    def per_image(img):
        mean = img.reduceRegion(
            ee.Reducer.mean(), geometry=aoi, scale=25000, maxPixels=1e9
        ).get(C.GRACE_BAND)
        return ee.Feature(None, {"month": img.date().format("YYYY-MM"), "cm": mean})

    feats = coll.map(per_image).getInfo()["features"]
    return [
        {"month": f["properties"]["month"], "anomaly_cm": f["properties"]["cm"]}
        for f in feats
        if f["properties"]["cm"] is not None
    ]


# ------------------------------------------------------------ forecast ----
def _month_index(ym: str) -> int:
    y, m = ym.split("-")
    return int(y) * 12 + int(m) - 1


def _index_month(i: int) -> str:
    return f"{i // 12:04d}-{i % 12 + 1:02d}"


def forecast(series: list[dict], months: int = C.FORECAST_MONTHS,
             critical_cm: float | None = None) -> dict:
    """Linear trend + mean-seasonal fallback forecast with widening band.

    If Prophet is installed it is used instead (same output schema).
    `critical_cm`: threshold anomaly; default = (min observed) - 5 cm,
    declared as a demo/operational threshold, NOT a hydrogeological constant.
    """
    obs = [(p["month"], float(p["anomaly_cm"])) for p in series]
    xs = [_month_index(m) for m, _ in obs]
    ys = [v for _, v in obs]
    n = len(xs)
    if n < 24:
        raise ValueError("need >= 24 monthly points")

    try:  # optional Prophet
        from prophet import Prophet  # type: ignore
        import pandas as pd  # type: ignore

        df = pd.DataFrame(
            {"ds": [f"{m}-15" for m, _ in obs], "y": ys}
        )
        m = Prophet(yearly_seasonality=True, weekly_seasonality=False,
                    daily_seasonality=False)
        m.fit(df)
        future = m.make_future_dataframe(periods=months, freq="MS")
        fc = m.predict(future).tail(months)
        out = [
            {
                "month": str(r.ds)[:7],
                "yhat": round(float(r.yhat), 2),
                "lo": round(float(r.yhat_lower), 2),
                "hi": round(float(r.yhat_upper), 2),
            }
            for r in fc.itertuples()
        ]
        engine = "prophet"
    except Exception:
        # transparent fallback: OLS trend on last 8 years + monthly climatology
        cut = xs[-1] - 8 * 12
        recent = [(x, y) for x, y in zip(xs, ys) if x >= cut]
        rx = [x for x, _ in recent]
        ry = [y for _, y in recent]
        mx = sum(rx) / len(rx)
        my = sum(ry) / len(ry)
        slope = sum((x - mx) * (y - my) for x, y in recent) / max(
            sum((x - mx) ** 2 for x in rx), 1e-9
        )
        seas = {m: [] for m in range(12)}
        for x, y in recent:
            seas[x % 12].append(y - (my + slope * (x - mx)))
        seas_mean = {m: (sum(v) / len(v) if v else 0.0) for m, v in seas.items()}
        resid = [
            y - (my + slope * (x - mx)) - seas_mean[x % 12] for x, y in recent
        ]
        sigma = math.sqrt(sum(r * r for r in resid) / max(len(resid) - 2, 1))
        out = []
        for k in range(1, months + 1):
            x = xs[-1] + k
            yhat = my + slope * (x - mx) + seas_mean[x % 12]
            band = 1.96 * sigma * math.sqrt(1 + k / 12.0)  # widening uncertainty
            out.append(
                {
                    "month": _index_month(x),
                    "yhat": round(yhat, 2),
                    "lo": round(yhat - band, 2),
                    "hi": round(yhat + band, 2),
                }
            )
        engine = "linear+seasonal (fallback)"

    thr = critical_cm if critical_cm is not None else min(ys) - 5.0
    critical_month = next((p["month"] for p in out if p["yhat"] <= thr), None)
    return {
        "engine": engine,
        "threshold_cm": round(thr, 2),
        "threshold_note_ar": "عتبة تشغيلية معلَنة (أدنى مرصود − 5 سم) — ليست ثابتاً هيدروجيولوجياً",
        "threshold_note_en": "Declared operational threshold (min observed - 5 cm) - not a hydrogeological constant",
        "critical_month": critical_month,
        "region_phrase_ar": "منحنى GRACE للأردن/المنطقة الشرقية — إشارة إقليمية",
        "region_phrase_en": "GRACE curve for Jordan / the eastern region - a regional signal",
        "forecast": out,
        "generated": date.today().isoformat(),
    }


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=None)
    ap.add_argument("--tws-out", default="data/tws_series.json")
    ap.add_argument("--forecast-out", default="data/forecast.json")
    args = ap.parse_args()

    tws = extract_tws(args.project)
    json.dump({"demo": False, "series": tws}, open(args.tws_out, "w"))
    json.dump({"demo": False, **forecast(tws)}, open(args.forecast_out, "w"))
    print(f"wrote {args.tws_out} ({len(tws)} months) and {args.forecast_out}")
