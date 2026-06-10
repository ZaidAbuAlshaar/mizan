/* ============================================================
   MIZAN — Demo data (all bilingual). Every value here is
   illustrative ("demo data"). Coordinates sit inside the
   Azraq basin bbox per the brief.
   ============================================================ */
(function () {
  // ---- Basins (health index) ----
  const basins = [
    {
      id: "azraq",
      name_ar: "الأزرق", name_en: "Azraq",
      pumping: 215, status: "critical",
      health_ar: "مُجهَد حرِج", health_en: "Critically stressed",
      // map polygon in lon/lat (approx, eastern desert)
      poly: [[36.55,32.10],[37.25,32.05],[37.35,31.55],[36.95,31.20],[36.45,31.35],[36.40,31.85]],
      label_at: [36.85, 31.65],
    },
    {
      id: "amman_zarqa",
      name_ar: "عمّان–الزرقا", name_en: "Amman–Zarqa",
      pumping: 176, status: "critical",
      health_ar: "مُجهَد حرِج", health_en: "Critically stressed",
      poly: [[35.85,32.30],[36.55,32.30],[36.55,31.90],[36.05,31.80],[35.80,32.00]],
      label_at: [36.18, 32.08],
    },
    {
      id: "yarmouk",
      name_ar: "اليرموك", name_en: "Yarmouk",
      pumping: 132, status: "stressed",
      health_ar: "مُجهَد", health_en: "Stressed",
      poly: [[35.70,32.72],[36.45,32.66],[36.55,32.32],[35.85,32.32],[35.68,32.45]],
      label_at: [36.05, 32.52],
    },
  ];

  // ---- Inspection queue rows (coords inside Azraq bbox) ----
  const queue = [
    {
      rank: 1, gps: "31.92N, 36.88E", lat: 31.92, lon: 36.88,
      area_ha: 14.2, first_seen: 2021,
      m3_low: 85, m3_high: 128, m3_unit_ar: "ألف", m3_unit_en: "k",
      score: 86, grade: "critical", status: "new",
      area_km: "≈300 km",
      score_parts: [
        { k_ar: "ثبات NDVI صيفاً", k_en: "Summer NDVI persistence", v: 31, max: 35 },
        { k_ar: "نمط الدوائر المحورية", k_en: "Center-pivot pattern", v: 24, max: 25 },
        { k_ar: "غياب مصدر سطحي (JRC)", k_en: "No surface source (JRC)", v: 18, max: 20 },
        { k_ar: "شذوذ الرطوبة (SMAP)", k_en: "Soil-moisture anomaly (SMAP)", v: 13, max: 20 },
      ],
    },
    {
      rank: 2, gps: "31.78N, 36.61E", lat: 31.78, lon: 36.61,
      area_ha: 9.5, first_seen: 2019,
      m3_low: 57, m3_high: 86, m3_unit_ar: "ألف", m3_unit_en: "k",
      score: 74, grade: "critical", status: "new",
      area_km: "≈300 km",
      score_parts: [
        { k_ar: "ثبات NDVI صيفاً", k_en: "Summer NDVI persistence", v: 27, max: 35 },
        { k_ar: "نمط الدوائر المحورية", k_en: "Center-pivot pattern", v: 19, max: 25 },
        { k_ar: "غياب مصدر سطحي (JRC)", k_en: "No surface source (JRC)", v: 16, max: 20 },
        { k_ar: "شذوذ الرطوبة (SMAP)", k_en: "Soil-moisture anomaly (SMAP)", v: 12, max: 20 },
      ],
    },
    {
      rank: 3, gps: "32.04N, 36.95E", lat: 32.04, lon: 36.95,
      area_ha: 6.1, first_seen: 2022,
      m3_low: 37, m3_high: 55, m3_unit_ar: "ألف", m3_unit_en: "k",
      score: 58, grade: "stressed", status: "inspecting",
      area_km: "≈300 km",
      score_parts: [
        { k_ar: "ثبات NDVI صيفاً", k_en: "Summer NDVI persistence", v: 21, max: 35 },
        { k_ar: "نمط الدوائر المحورية", k_en: "Center-pivot pattern", v: 14, max: 25 },
        { k_ar: "غياب مصدر سطحي (JRC)", k_en: "No surface source (JRC)", v: 13, max: 20 },
        { k_ar: "شذوذ الرطوبة (SMAP)", k_en: "Soil-moisture anomaly (SMAP)", v: 10, max: 20 },
      ],
    },
  ];

  // extra scatter dots for the national map (candidate fields)
  const fields = [
    { lat: 31.92, lon: 36.88, grade: "critical", rank: 1 },
    { lat: 31.78, lon: 36.61, grade: "critical", rank: 2 },
    { lat: 32.04, lon: 36.95, grade: "stressed", rank: 3 },
    { lat: 31.66, lon: 36.74, grade: "critical" },
    { lat: 31.84, lon: 37.02, grade: "stressed" },
    { lat: 32.10, lon: 36.70, grade: "stressed" },
    { lat: 31.55, lon: 36.50, grade: "healthy" },
    { lat: 31.98, lon: 36.55, grade: "stressed" },
    { lat: 32.20, lon: 36.30, grade: "critical" },
    { lat: 32.30, lon: 36.10, grade: "stressed" },
    { lat: 31.72, lon: 36.90, grade: "healthy" },
    { lat: 31.60, lon: 37.10, grade: "stressed" },
  ];

  // ---- NDVI series for evidence panel (patch #1) — LTR time axis ----
  // monthly-ish samples 2016..2026, value 0..1
  const ndvi = [
    {y:2016,v:0.08},{y:2017,v:0.10},{y:2018,v:0.12},{y:2019,v:0.22},
    {y:2020,v:0.31},{y:2021,v:0.48},{y:2022,v:0.55},{y:2023,v:0.61},
    {y:2024,v:0.63},{y:2025,v:0.66},{y:2026,v:0.64},
  ];

  // ---- GRACE TWS anomaly (regional, Eastern Jordan) 2002..2024 + forecast ----
  // value = equivalent water thickness anomaly (cm), declining
  const grace = [
    {y:2002,v:2.1},{y:2003,v:1.4},{y:2004,v:0.6},{y:2005,v:-0.2},
    {y:2006,v:-1.1},{y:2007,v:-1.9},{y:2008,v:-2.6},{y:2009,v:-3.0},
    {y:2010,v:-3.9},{y:2011,v:-4.6},{y:2012,v:-5.2},{y:2013,v:-6.1},
    {y:2014,v:-6.8},{y:2015,v:-7.6},{y:2016,v:-8.3},
    /* GRACE gap 2017-2018 */
    {y:2017,v:null,gap:true},{y:2018,v:null,gap:true},
    {y:2019,v:-9.9},{y:2020,v:-10.7},{y:2021,v:-11.6},
    {y:2022,v:-12.5},{y:2023,v:-13.4},{y:2024,v:-14.2},
  ];
  // dashed forecast continuation
  const graceForecast = [
    {y:2024,v:-14.2},{y:2025,v:-15.1},{y:2026,v:-16.0},{y:2027,v:-16.9},
    {y:2028,v:-17.8},{y:2029,v:-18.7},{y:2030,v:-19.6},
  ];
  const graceThreshold = { yLow: 2028, yHigh: 2031, v: -18.5 }; // critical window (range)

  // ---- Impact figures (ranges, stated assumptions) ----
  const impact = {
    m3: { conservative: 150, mid: 200, high: 250, unit_ar: "مليون م³/سنة", unit_en: "M m³/yr" },
    people: { conservative: 560, mid: 746, high: 933, unit_ar: "ألف شخص·سنة", unit_en: "k person-yr" },
    dollars: { conservative: 90, mid: 140, high: 190, unit_ar: "مليون دولار/سنة", unit_en: "M USD/yr" },
    carrier: { value: 300, unit_ar: "مليون م³/سنة", unit_en: "M m³/yr", cost_ar: "مشروع ٦ مليارات دولار", cost_en: "$6 billion project" },
  };

  // ---- Balance ledger (basin) ----
  const ledger = {
    pan1: { low: 350, high: 450, label_ar: "فقد إقليمي مقيس (GRACE)", label_en: "Measured regional loss (GRACE)" },
    pan2: { low: 150, high: 250, label_ar: "مرخَّص + تغذية + ET المكتشف", label_en: "Licensed + recharge + detected ET" },
    deficit: { low: 150, high: 250, label_ar: "العجز المجهول", label_en: "Unexplained deficit" },
  };

  // ---- Datasets (methodology) ----
  const datasets = [
    { id:"s2",  name:"Sentinel-2 L2A", role_ar:"الكاشف الأساسي · 10م", role_en:"Primary detector · 10 m", tier:"A" },
    { id:"l89", name:"Landsat 8/9",    role_ar:"تدقيق + عمق تاريخي", role_en:"Validation + historical depth", tier:"A" },
    { id:"hls", name:"HLS v2",         role_ar:"سلسلة زمنية موحّدة", role_en:"Harmonized time series", tier:"A" },
    { id:"mod", name:"MODIS NDVI/ET",  role_ar:"الاتجاه + تقدير م³", role_en:"Trend + m³ estimate", tier:"A" },
    { id:"gr",  name:"GRACE + GRACE-FO mascon", role_ar:"الميزان الإقليمي · 2002→2024", role_en:"Regional balance · 2002→2024", tier:"A" },
    { id:"gld", name:"GLDAS G025 / DA1D", role_ar:"خريطة جوفية مشتقّة من الجاذبية", role_en:"Gravity-derived groundwater map", tier:"B" },
    { id:"smap",name:"SMAP L4",        role_ar:"تمييز بعلي/مروي", role_en:"Rain-fed vs irrigated", tier:"A" },
    { id:"chp", name:"CHIRPS",         role_ar:"شاهد النفي المطري", role_en:"Rainfall null-test", tier:"A" },
    { id:"era", name:"ERA5-Land",      role_ar:"حرارة / ET₀", role_en:"Temperature / ET₀", tier:"A" },
    { id:"jrc", name:"JRC Surface Water", role_ar:"استبعاد الريّ السطحي", role_en:"Exclude surface irrigation", tier:"A" },
    { id:"dw",  name:"Dynamic World / WorldCover / WorldCereal", role_ar:"تسميات ضعيفة (weak labels)", role_en:"Weak labels", tier:"B" },
    { id:"srtm",name:"SRTM · HydroSHEDS · FAO GAUL", role_ar:"تضاريس + حدود + أحواض", role_en:"Terrain + boundaries + basins", tier:"A" },
  ];

  // ---- References ----
  const refs = [
    { tag_ar:"البرهان القاطع", tag_en:"Core evidence", cite:"Gropius et al., Hydrogeology Journal 30 (2022)" },
    { tag_ar:"عمل سابق — إيران", tag_en:"Prior art — Iran", cite:"Sassani et al., Sci Rep 15:6500 (2025)" },
    { tag_ar:"الأحواض 144–360٪", tag_en:"Basins 144–360%", cite:"MDPI Water" },
    { tag_ar:"أرقام الإنفاذ", tag_en:"Enforcement figures", cite:"Jordan Times, 11/2024" },
    { tag_ar:"المناسيب", tag_en:"Water levels", cite:"MWI / IWMI (ratios from MWI 2009)" },
  ];

  // ---- Limits (honesty as a weapon) ----
  const limits = [
    { ar:"GRACE خشن ~٣٠٠كم — ماكرو فقط، لا ادعاء حقلي من الجاذبية.",
      en:"GRACE is coarse ~300 km — macro only; no field-level claim from gravity." },
    { ar:"إيجابيات كاذبة محتملة → مرشّحات لا اتهامات + human-in-the-loop.",
      en:"Possible false positives → candidates not accusations + human-in-the-loop." },
    { ar:"بيانات التراخيص غير متاحة → استراتيجية Tier A/B/C وأي طبقة mock موسومة «demo data».",
      en:"Licence data unavailable → Tier A/B/C strategy; any mock layer marked “demo data”." },
    { ar:"زمن GRACE شهري + فجوة 2017–2018 تُظهَر بشفافية.",
      en:"GRACE cadence is monthly + the 2017–2018 gap is shown transparently." },
    { ar:"حساسية سياسية → أداة دعم قرار للوزارة، لا «وشاية»، ولا تُعرّف أفراداً.",
      en:"Politically sensitive → a ministry decision-support tool, not an informant; never identifies individuals." },
  ];

  window.MIZAN_DATA = { basins, queue, fields, ndvi, grace, graceForecast, graceThreshold, impact, ledger, datasets, refs, limits };
})();
