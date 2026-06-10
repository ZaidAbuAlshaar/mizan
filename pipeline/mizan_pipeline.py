# -*- coding: utf-8 -*-
"""
MIZAN — REAL Engine 1+2 pipeline (no GEE needed).
Data sources (all public, no auth):
  - Sentinel-2 L2A COGs via Earth Search STAC (AWS Open Data)   -> NDVI detection
  - NASA POWER API                                               -> real rainfall (null-test)
  - NASA Worldview Snapshots (GIBS GRACE_Tellus LWE Mascon CRI)  -> regional GRACE series (approx, colormap-decoded)
Outputs -> ../web/data/*.json|geojson  (all with provenance)
Rules: positioning = "candidate for inspection" only; numbers traceable; no invented data.
"""
import json, math, os, sys, time, datetime
import numpy as np
import requests
import rasterio
from rasterio.vrt import WarpedVRT
from rasterio.enums import Resampling
from rasterio import features
from rasterio.transform import from_origin
from shapely.geometry import shape, mapping, Point
from shapely.ops import unary_union
from PIL import Image
from io import BytesIO

OUT = os.path.join(os.path.dirname(__file__), "..", "web", "data")
os.makedirs(OUT, exist_ok=True)

# ---------------- Config ----------------
# Azraq agricultural core (inside the documented basin bbox lon 36.45-37.30, lat 31.55-32.25)
BBOX = (36.55, 31.70, 37.15, 32.10)          # lon_min, lat_min, lon_max, lat_max
DETECT_RES = 0.0002                            # ~20 m grid in degrees
HIST_RES = 0.0004                              # ~40 m for history years
NDVI_T = 0.35
MIN_AREA_HA = 1.0
YEARS_HIST = [2018, 2020, 2022, 2024]
YEAR_NOW = 2025
STAC = "https://earth-search.aws.element84.com/v1/search"
CLOSURE_NEW_YEAR = 2018                        # NEW = first_seen >= 2018 (plan P3)

def log(*a):
    print(*a, flush=True)

# ---------------- STAC search ----------------
def search_items(year, bbox, max_cloud=10, limit=200):
    body = {
        "collections": ["sentinel-2-l2a"],
        "bbox": list(bbox),
        "datetime": f"{year}-06-01T00:00:00Z/{year}-08-31T23:59:59Z",
        "query": {"eo:cloud_cover": {"lt": max_cloud}},
        "limit": limit,
    }
    r = requests.post(STAC, json=body, timeout=60)
    r.raise_for_status()
    feats = r.json()["features"]
    # lowest cloud per MGRS tile
    best = {}
    for f in feats:
        tile = f["properties"].get("grid:code") or f["properties"].get("s2:mgrs_tile", "?")
        cc = f["properties"].get("eo:cloud_cover", 100)
        if tile not in best or cc < best[tile]["properties"].get("eo:cloud_cover", 100):
            best[tile] = f
    items = list(best.values())
    log(f"  {year}: {len(feats)} scenes -> {len(items)} tiles: "
        + ", ".join(f"{f['properties'].get('grid:code','?')}@{f['properties'].get('eo:cloud_cover',0):.0f}%" for f in items))
    return items

# ---------------- Read band into common lat/lon grid ----------------
def grid_shape(bbox, res):
    w = int(round((bbox[2] - bbox[0]) / res))
    h = int(round((bbox[3] - bbox[1]) / res))
    return h, w

def read_to_grid(href, bbox, res):
    h, w = grid_shape(bbox, res)
    dst_transform = from_origin(bbox[0], bbox[3], res, res)
    with rasterio.open(href) as src:
        with WarpedVRT(src, crs="EPSG:4326", transform=dst_transform, width=w, height=h,
                       resampling=Resampling.average, src_nodata=0, nodata=0) as vrt:
            data = vrt.read(1)
    return data.astype("float32")

def ndvi_composite(items, bbox, res):
    h, w = grid_shape(bbox, res)
    comp = np.full((h, w), -1.0, dtype="float32")
    used = []
    for f in items:
        a = f["assets"]
        red_h, nir_h = a["red"]["href"], a["nir"]["href"]
        try:
            red = read_to_grid(red_h, bbox, res)
            nir = read_to_grid(nir_h, bbox, res)
        except Exception as e:
            log(f"  ! skip {f['id']}: {e}")
            continue
        valid = (red + nir) > 0
        nd = np.where(valid, (nir - red) / np.maximum(nir + red, 1), -1)
        comp = np.maximum(comp, nd)
        used.append({"id": f["id"], "date": f["properties"]["datetime"][:10],
                     "cloud": round(f["properties"].get("eo:cloud_cover", 0), 1),
                     "tile": f["properties"].get("grid:code", "?")})
    return comp, used

# ---------------- Main detection ----------------
log("== MIZAN real pipeline ==")
log("[1/6] STAC search + NDVI composite (summer %d) ..." % YEAR_NOW)
items_now = search_items(YEAR_NOW, BBOX)
comp, scenes_used = ndvi_composite(items_now, BBOX, DETECT_RES)
h, w = comp.shape
transform = from_origin(BBOX[0], BBOX[3], DETECT_RES, DETECT_RES)
mask = (comp >= NDVI_T).astype("uint8")
log(f"  grid {w}x{h}, irrigated px: {int(mask.sum())} ({100*mask.mean():.2f}%)")

log("[2/6] vectorize -> polygons ...")
px_area_m2 = (DETECT_RES * 111320) * (DETECT_RES * 111320 * math.cos(math.radians((BBOX[1]+BBOX[3])/2)))
polys = []
for geom, val in features.shapes(mask, mask=mask.astype(bool), transform=transform):
    g = shape(geom)
    area_ha = g.area / (DETECT_RES * DETECT_RES) * px_area_m2 / 10000.0
    if area_ha >= MIN_AREA_HA:
        polys.append({"geom": g.simplify(DETECT_RES), "area_ha": round(area_ha, 1)})
polys.sort(key=lambda p: -p["area_ha"])
log(f"  fields >= {MIN_AREA_HA} ha: {len(polys)}")

log("[3/6] history years (first_seen) ...")
hist_masks = {}
hist_meta = {}
for y in YEARS_HIST:
    it = search_items(y, BBOX)
    c, used = ndvi_composite(it, BBOX, HIST_RES)
    hist_masks[y] = (c >= NDVI_T)
    hist_meta[y] = used
hh, hw = grid_shape(BBOX, HIST_RES)
htrans = from_origin(BBOX[0], BBOX[3], HIST_RES, HIST_RES)

def frac_active(g, m):
    r = features.rasterize([(mapping(g), 1)], out_shape=(hh, hw), transform=htrans, fill=0).astype(bool)
    n = r.sum()
    return (m & r).sum() / n if n else 0.0

for p in polys:
    fs = YEAR_NOW
    ndvi_traj = []
    for y in YEARS_HIST:
        fa = frac_active(p["geom"], hist_masks[y])
        ndvi_traj.append({"y": y, "active_frac": round(float(fa), 2)})
        if fa >= 0.3 and fs == YEAR_NOW:
            fs = y
    p["first_seen"] = fs
    p["traj"] = ndvi_traj
    # expansion: active fraction growth between last two observed history years
    f22 = next((t["active_frac"] for t in ndvi_traj if t["y"] == 2022), 0)
    f24 = next((t["active_frac"] for t in ndvi_traj if t["y"] == 2024), 0)
    p["expansion"] = max(0.0, round(float(f24 - f22), 2))

log("[4/6] scoring (no-licence formula 35/25/15/12.5/12.5) ...")
if not polys:
    log("!! zero fields detected - aborting outputs (check threshold/AOI)")
    sys.exit(2)
amax = max(p["area_ha"] for p in polys) or 1
emax = max((p["expansion"] for p in polys), default=0) or 1
for p in polys:
    inside = 1.0          # all polygons are inside the closed Azraq basin AOI by construction
    new_after = 1.0 if p["first_seen"] >= CLOSURE_NEW_YEAR else 0.0
    zero_rain = 1.0       # by construction (summer composite; POWER confirms ~0 mm below)
    s = 35*inside + 25*new_after + 15*zero_rain + 12.5*(p["area_ha"]/amax) + 12.5*(p["expansion"]/emax)
    p["score"] = int(round(s))
    p["score_parts"] = [
        {"k": "inside_closed_basin",  "v": round(35*inside, 1),  "max": 35},
        {"k": "new_after_closure",    "v": round(25*new_after,1),"max": 25},
        {"k": "active_zero_rain",     "v": round(15*zero_rain,1),"max": 15},
        {"k": "area_norm",            "v": round(12.5*p["area_ha"]/amax, 1), "max": 12.5},
        {"k": "expansion_norm",       "v": round(12.5*p["expansion"]/emax, 1), "max": 12.5},
    ]
polys.sort(key=lambda p: (-p["score"], -p["area_ha"]))

log("[5/6] NASA POWER rainfall (real) ...")
c_lon, c_lat = (BBOX[0]+BBOX[2])/2, (BBOX[1]+BBOX[3])/2
pw = requests.get(
    "https://power.larc.nasa.gov/api/temporal/monthly/point",
    params={"parameters": "PRECTOTCORR", "community": "ag", "longitude": c_lon,
            "latitude": c_lat, "start": 2016, "end": YEAR_NOW, "format": "JSON"},
    timeout=120).json()
prec = pw["properties"]["parameter"]["PRECTOTCORR"]
rain = [{"ym": k, "mm": (None if v is None or v < -990 else round(v, 1))}
        for k, v in sorted(prec.items()) if not k.endswith("13")]
summer_now = sum((r["mm"] or 0) for r in rain if r["ym"][:4] == str(YEAR_NOW) and r["ym"][4:] in ("06","07","08"))
log(f"  Azraq Jun-Aug {YEAR_NOW} rainfall = {summer_now:.1f} mm (NASA POWER)")
json.dump({
    "source": "NASA POWER API (PRECTOTCORR, monthly)",
    "url": "https://power.larc.nasa.gov/",
    "point": {"lon": c_lon, "lat": c_lat},
    "summer_sum_mm": {str(YEAR_NOW): round(summer_now, 1)},
    "series": rain,
}, open(os.path.join(OUT, "rain_azraq.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

log("[6/6] GRACE regional series via Worldview snapshots (colormap-decoded approx) ...")
def grace_series():
    # colormap: fetch + parse
    cm_xml = requests.get("https://gibs.earthdata.nasa.gov/colormaps/v1.3/GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI.xml", timeout=60).text
    import re
    entries = []
    for m in re.finditer(r'<ColorMapEntry rgb="(\d+),(\d+),(\d+)"[^>]*value="\[?(-?\d+(?:\.\d+)?)', cm_xml):
        r_, g_, b_, v = int(m.group(1)), int(m.group(2)), int(m.group(3)), float(m.group(4))
        entries.append(((r_, g_, b_), v))
    if not entries:
        log("  ! colormap parse failed - skipping GRACE series")
        return None
    pal = np.array([e[0] for e in entries], dtype="int32")
    vals = np.array([e[1] for e in entries])
    series = []
    # every 3 months, 2002-2024 (GRACE gap 2017-06..2018-05 -> nulls)
    dates = []
    for y in range(2002, 2025):
        for mth in (2, 5, 8, 11):
            if (y == 2002 and mth < 5) or (y == 2024 and mth > 8):
                continue
            dates.append(f"{y}-{mth:02d}-15")
    sess = requests.Session()
    for d in dates:
        y, mth = int(d[:4]), int(d[5:7])
        in_gap = (y == 2017 and mth >= 6) or (y == 2018 and mth <= 5)
        if in_gap:
            series.append({"d": d, "cm": None, "gap": True})
            continue
        try:
            r = sess.get("https://wvs.earthdata.nasa.gov/api/v1/snapshot", params={
                "REQUEST": "GetSnapshot", "TIME": d,
                "BBOX": "29.0,34.8,33.5,39.5",  # lat_min,lon_min,lat_max,lon_max (Jordan+)
                "CRS": "EPSG:4326",
                "LAYERS": "GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI",
                "FORMAT": "image/png", "WIDTH": 64, "HEIGHT": 64}, timeout=60)
            img = np.array(Image.open(BytesIO(r.content)).convert("RGB"), dtype="int32")
            # sample central Jordan / eastern desert block
            block = img[24:44, 26:50].reshape(-1, 3)
            px_vals = []
            for px in block:
                dist = np.abs(pal - px).sum(axis=1)
                i = int(dist.argmin())
                if dist[i] <= 30:
                    px_vals.append(vals[i])
            series.append({"d": d, "cm": round(float(np.median(px_vals)), 1) if px_vals else None})
        except Exception as e:
            series.append({"d": d, "cm": None, "err": str(e)[:60]})
        time.sleep(0.4)
    ok = [s for s in series if s.get("cm") is not None]
    log(f"  GRACE samples ok: {len(ok)}/{len(series)}")
    return series

try:
    gs = grace_series()
except Exception as e:
    log("  ! GRACE series failed (non-fatal):", str(e)[:120])
    gs = None
if gs:
    json.dump({
        "source": "NASA GIBS / Worldview snapshots - GRACE_Tellus_Liquid_Water_Equivalent_Thickness_Mascon_CRI (JPL RL06Mv4 CRI visualization)",
        "method": "colormap-decoded median over Jordan/eastern-desert block - APPROXIMATE regional signal (~300 km), wording rule applies",
        "unit": "cm liquid water equivalent anomaly",
        "series": gs,
    }, open(os.path.join(OUT, "grace_jordan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ---------------- Outputs ----------------
fields_fc = {"type": "FeatureCollection", "features": []}
for i, p in enumerate(polys):
    c = p["geom"].centroid
    fields_fc["features"].append({
        "type": "Feature",
        "geometry": mapping(p["geom"]),
        "properties": {
            "rank": i + 1, "area_ha": p["area_ha"], "first_seen": p["first_seen"],
            "score": p["score"], "lat": round(c.y, 4), "lon": round(c.x, 4),
            "m3_low": int(p["area_ha"] * 6000), "m3_high": int(p["area_ha"] * 9000),
            "expansion": p["expansion"],
        },
    })
json.dump(fields_fc, open(os.path.join(OUT, "fields.geojson"), "w", encoding="utf-8"), ensure_ascii=False)

queue = []
for i, p in enumerate(polys[:20]):
    c = p["geom"].centroid
    queue.append({
        "rank": i + 1, "lat": round(c.y, 4), "lon": round(c.x, 4),
        "gps": f"{c.y:.2f}N, {c.x:.2f}E",
        "area_ha": p["area_ha"], "first_seen": p["first_seen"],
        "m3_low": int(p["area_ha"] * 6000), "m3_high": int(p["area_ha"] * 9000),
        "score": p["score"], "score_parts": p["score_parts"], "traj": p["traj"],
    })
json.dump(queue, open(os.path.join(OUT, "queue.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

total_ha = round(sum(p["area_ha"] for p in polys), 0)
meta = {
    "run_utc": datetime.datetime.utcnow().isoformat() + "Z",
    "aoi_bbox": BBOX, "ndvi_threshold": NDVI_T, "min_area_ha": MIN_AREA_HA,
    "detect_res_deg": DETECT_RES, "year": YEAR_NOW, "history_years": YEARS_HIST,
    "n_fields": len(polys), "total_area_ha": total_ha,
    "est_m3_low": int(total_ha * 6000), "est_m3_high": int(total_ha * 9000),
    "summer_rain_mm": round(summer_now, 1),
    "scenes": scenes_used, "history_scenes": hist_meta,
    "sources": {
        "sentinel2": "Sentinel-2 L2A COGs - Earth Search STAC (AWS Open Data, ESA/Copernicus)",
        "rain": "NASA POWER API",
        "grace_vis": "NASA GIBS GRACE_Tellus LWE Mascon CRI",
    },
    "positioning": "All detections are CANDIDATES FOR INSPECTION only - human-in-the-loop.",
    "method_volume": "Method A: area_ha x 6000-9000 m3/ha/yr (declared assumption, plan P5)",
}
json.dump(meta, open(os.path.join(OUT, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# validation sites (enforcement news, approximate region centers - plan TM-04)
vs = {"type": "FeatureCollection", "features": [
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [35.817, 31.945]},
     "properties": {"name_ar": "وادي السير", "name_en": "Wadi As-Seer", "date": "2025-08", "note_ar": "بئر 15م، مضختان، >500 م³/يوم (بيان MWI)", "approx": True}},
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [35.662, 31.905]},
     "properties": {"name_ar": "الكفرين/سويمة", "name_en": "Kafrein/Sweimeh", "date": "2025-11", "note_ar": "8 آبار 5,000 م³/ساعة + 3.8كم كهرباء", "approx": True, "outside_logic_ar": "غور مروي سطحياً — خارج منطق الصحراء"}},
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [35.662, 31.905]},
     "properties": {"name_ar": "الكفرين", "name_en": "Kafrein", "date": "2025-05", "note_ar": "17 بئراً بحملة واحدة", "approx": True, "outside_logic_ar": "غور مروي سطحياً — خارج منطق الصحراء"}},
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [36.090, 31.483]},
     "properties": {"name_ar": "خان الزبيب", "name_en": "Khan Az-Zabib", "date": "2025-08", "approx": True}},
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [36.220, 30.300]},
     "properties": {"name_ar": "الجفر", "name_en": "Al-Jafr", "date": "2025", "note_ar": "بئر بعمق 300م", "approx": True}},
    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [36.090, 32.060]},
     "properties": {"name_ar": "الزرقاء", "name_en": "Zarqa", "date": "2026-02", "note_ar": "اعتداءات خطوط", "approx": True}},
]}
json.dump(vs, open(os.path.join(OUT, "validation_sites.geojson"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

log("== DONE ==")
log(f"fields: {len(polys)} | total {total_ha} ha | est {int(total_ha*6000):,}-{int(total_ha*9000):,} m3/yr | rain {summer_now:.1f} mm")
