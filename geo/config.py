"""MIZAN — central configuration for the GEE pipeline (P1–P7).

Every dataset ID here was independently verified against the GEE catalog
on 2026-06-09 — see docs/VERIFICATION.md §3. Numbers (thresholds, weights)
trace to the constitution §11 / plan.md Appendix A. Do not invent numbers.
"""

# ---------------------------------------------------------------- AOI -----
# Azraq pilot AOI (constitution §11, TM-05). Replace BBOX with the basin
# polygon (data/azraq_basin.geojson -> HydroSHEDS hybas_7 / BGR-MWI) when
# available; the bbox is the documented fallback.
AOI_BBOX = [36.45, 31.55, 37.30, 32.25]  # lon_min, lat_min, lon_max, lat_max
AOI_NAME = "azraq"
SECONDARY_AOI_NAME = "amman_zarqa"  # H8 fallback — enable wastewater exclusion!

# ------------------------------------------------------- dataset IDs ------
# (verified — docs/VERIFICATION.md §3)
S2_SR = "COPERNICUS/S2_SR_HARMONIZED"          # L2A; unreliable over Jordan pre ~2018/19
S2_TOA = "COPERNICUS/S2_HARMONIZED"            # L1C TOA; 2015-06 -> ; use for 2016 time machine
S2_CLOUD_PROB = "COPERNICUS/S2_CLOUD_PROBABILITY"
LANDSAT8 = "LANDSAT/LC08/C02/T1_L2"
LANDSAT9 = "LANDSAT/LC09/C02/T1_L2"
CHIRPS_DAILY = "UCSB-CHG/CHIRPS/DAILY"
WORLDCOVER = "ESA/WorldCover/v200"
JRC_WATER = "JRC/GSW1_4/GlobalSurfaceWater"
DYNAMIC_WORLD = "GOOGLE/DYNAMICWORLD/V1"
GRACE_MASCON = "NASA/GRACE/MASS_GRIDS_V04/MASCON"   # RL06.3Mv04, 2002-03 -> 2024-09
GRACE_BAND = "lwe_thickness"                         # cm LWE (+ 'uncertainty' band)
GLDAS_GRACE_DA = "NASA/GLDAS/V022/CLSM/G025/DA1D"    # NOT .../CLSM/GRACE_DA (broken id)
MOD16A2 = "MODIS/061/MOD16A2"                        # GEE coverage starts 2021!
MOD16A2GF = "MODIS/061/MOD16A2GF"                    # gap-filled, 2000/2001 -> (pre-2021 ET)
MOD13Q1 = "MODIS/061/MOD13Q1"
SMAP_L4 = "NASA/SMAP/SPL4SMGP/008"                   # 007 was removed from the catalog
HYDROSHEDS_BASINS = "WWF/HydroSHEDS/v1/Basins/hybas_7"

# ------------------------------------------------ P2 rule-based mask ------
# constitution §11 P2 v1: pixel is irrigated iff ALL of:
NDVI_SUMMER_MIN = 0.35          # mean(NDVI, Jun–Aug) >= 0.35  (H6 fallback: 0.30/0.40)
CHIRPS_SUMMER_MAX_MM = 10       # sum(CHIRPS, Jun–Aug) < 10 mm
SUMMER_MONTHS = (6, 7, 8)
WORLDCOVER_CLASSES = (40, 60)   # 40 cropland, 60 bare/sparse
JRC_OCCURRENCE_MAX = 10         # exclude pixels with surface-water occurrence > 10%
# Treated-wastewater exclusion (Amman-Zarqa: Zarqa river / As-Samra) —
# buffer (m) around known wastewater-irrigated corridors. Supply geometry
# when running the secondary AOI; harmless empty default for Azraq.
WASTEWATER_EXCLUSION_BUFFER_M = 1500

# ----------------------------------------------- P3 change detection ------
ANNUAL_YEARS = list(range(2017, 2027))   # S2 SR era; extend back with Landsat
NEW_AFTER_YEAR = 2018                    # NEW if first_seen_year >= 2018
EXPANDING_RATE = 0.25                    # >25%/yr area growth
MIN_FIELD_AREA_HA = 0.5
EXPORT_SCALE_M = 10                      # drop to 20 m if exports exceed 45 min (risk register)

# ----------------------------------------------------- P4 scoring ---------
# score = sum(weight_i * component_i), components in [0,1]; weights sum to 100
SCORE_WEIGHTS = {
    "inside_protected_basin": 30,
    "is_new_after_closure": 20,
    "active_in_zero_rain_months": 15,
    "distance_to_nearest_licensed_well": 15,  # normalized; Tier A/C layer
    "area_ha": 10,                            # normalized
    "expansion_rate": 10,                     # normalized
}
SCORE_RED = 70    # 🔴 inspect first
SCORE_AMBER = 40  # 🟠 monitor;  green < 40

# ----------------------------------------------------- P5 volume ----------
# Method A (constitution §11 P5): area_ha x 6,000–9,000 m3/ha/yr (declared range)
M3_PER_HA_LOW = 6000
M3_PER_HA_HIGH = 9000
M3_PER_HA_MID = 7500   # midpoint used for single-number displays; range always declared

# ----------------------------------------------------- P6 forecast --------
GRACE_START = "2002-03-01"
GRACE_END = "2024-09-30"          # MASCON ends 2024-09 — cut the curve transparently
GRACE_GAP = ("2017-07", "2018-05")  # GRACE -> GRACE-FO gap, shown transparently
FORECAST_MONTHS = 60

# ----------------------------------------------------- basins (real) ------
# Stress %: MWI 2009 via IWMI (verified). Geometry placeholders are simplified
# for demo display ONLY — replace with HydroSHEDS/BGR before judging.
BASINS = {
    "azraq":       {"name_ar": "الأزرق",       "name_en": "Azraq",       "stress_pct": 215},
    "amman_zarqa": {"name_ar": "عمّان-الزرقا", "name_en": "Amman-Zarqa", "stress_pct": 176},
    "yarmouk":     {"name_ar": "اليرموك",      "name_en": "Yarmouk",     "stress_pct": 144},
}
# Basin closure year: TODO confirm official MWI closure date for Azraq before
# stating it on a slide (not in the verified numbers table). NEW_AFTER_YEAR
# (2018, from P3 definition) is used for the "new after closure" component.
