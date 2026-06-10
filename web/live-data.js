/* ============================================================
   MIZAN — LIVE/REAL data layer.
   Loads pipeline outputs (real Sentinel-2 detections, NASA POWER
   rainfall, GRACE regional series) and patches window.MIZAN_DATA.
   Falls back silently to the bundled demo data when files are
   unavailable (e.g. opened via file://) — badges reflect the mode.
   ============================================================ */
(function () {
  const PART_LABELS = {
    inside_closed_basin: ["داخل حوض مغلق قانونياً", "Inside legally closed basin"],
    new_after_closure: ["ظهور جديد بعد الإغلاق (≥2018)", "New after closure (≥2018)"],
    active_zero_rain: ["نشط بأشهر مطرها ≈ صفر (POWER)", "Active in ≈0 mm months (POWER)"],
    area_norm: ["حجم الرقعة (مُعاير)", "Patch area (normalized)"],
    expansion_norm: ["معدل التوسّع (مُعاير)", "Expansion rate (normalized)"],
  };
  const gradeOf = s => (s >= 70 ? "critical" : s >= 40 ? "stressed" : "healthy");

  const I18N_EXTRA = {
    ar: {
      realData: "بيانات حقيقية · NASA/ESA",
      liveNasa: "بث NASA حيّ",
      layer_none: "بلا طبقة قمر",
      layer_truecolor: "صورة القمر (حقيقية)",
      layer_ndvi: "NDVI — MODIS 8 أيام",
      layer_grace: "جاذبية GRACE (شهري)",
      layer_sites: "مواقع إنفاذ معلنة",
      rain_title: "شاهد النفي المطري — أمطار الأزرق",
      rain_sub: "NASA POWER · شهري · حقيقي",
      rain_summer: "مجموع حزيران–آب",
      basemap_note: "© OSM © CARTO · أقمار: NASA GIBS",
      approx_basins: "حدود الأحواض تقريبية للعرض",
      tm_real: "صور أقمار حقيقية (HLS 30م · NASA)",
      ev_ba_real: "قبل/بعد — HLS حقيقي 30م",
      detected_total: "رقعة مكتشفة فعلياً",
      grace_real_sub: "GRACE/GRACE-FO · مستخرَج من NASA GIBS (تقريبي إقليمي)",
      pipeline_stamp: "آخر تمريرة كشف",
      candidates_layer: "الحقول المكتشفة (حقيقية)",
    },
    en: {
      realData: "Real data · NASA/ESA",
      liveNasa: "NASA live",
      layer_none: "No satellite layer",
      layer_truecolor: "True color (real)",
      layer_ndvi: "NDVI — MODIS 8-day",
      layer_grace: "GRACE gravity (monthly)",
      layer_sites: "Published enforcement sites",
      rain_title: "Rainfall null-test — Azraq",
      rain_sub: "NASA POWER · monthly · real",
      rain_summer: "Jun–Aug total",
      basemap_note: "© OSM © CARTO · satellites: NASA GIBS",
      approx_basins: "Basin outlines approximate (display)",
      tm_real: "Real satellite imagery (HLS 30 m · NASA)",
      ev_ba_real: "Before/after — real HLS 30 m",
      detected_total: "patches actually detected",
      grace_real_sub: "GRACE/GRACE-FO · decoded from NASA GIBS (regional approx.)",
      pipeline_stamp: "Last detection pass",
      candidates_layer: "Detected fields (real)",
    },
  };

  window.MIZAN_LOAD = (async function () {
    const get = p => fetch(p).then(r => (r.ok ? r.json() : Promise.reject(new Error(p))));
    try {
      const [meta, queue, rain, fieldsFC] = await Promise.all([
        get("data/meta.json"), get("data/queue.json"), get("data/rain_azraq.json"), get("data/fields.geojson"),
      ]);
      const grace = await get("data/grace_jordan.json").catch(() => null);
      const vs = await get("data/validation_sites.geojson").catch(() => null);
      const M = window.MIZAN_DATA;

      /* ---- queue (REAL Sentinel-2 detections) ---- */
      M.queue = queue.map(q => ({
        rank: q.rank, gps: q.gps, lat: q.lat, lon: q.lon,
        area_ha: q.area_ha, first_seen: q.first_seen,
        m3_low: Math.max(1, Math.round(q.m3_low / 1000)),
        m3_high: Math.max(1, Math.round(q.m3_high / 1000)),
        m3_unit_ar: "ألف", m3_unit_en: "k",
        score: q.score, grade: gradeOf(q.score), status: "new",
        ndvi: (q.traj || []).map(t => ({ y: t.y, v: t.active_frac })).concat([{ y: 2025, v: 1 }]),
        score_parts: (q.score_parts || []).map(p => ({
          k_ar: (PART_LABELS[p.k] || [p.k, p.k])[0],
          k_en: (PART_LABELS[p.k] || [p.k, p.k])[1],
          v: p.v, max: p.max,
        })),
      }));

      /* ---- all fields for the map (centroids + polygons) ---- */
      M.fields = fieldsFC.features.slice(0, 500).map(f => ({
        lat: f.properties.lat, lon: f.properties.lon,
        grade: gradeOf(f.properties.score), rank: f.properties.rank,
        area_ha: f.properties.area_ha, score: f.properties.score,
      }));
      window.MIZAN_FIELDS_FC = fieldsFC;
      window.MIZAN_FIELDS_PTS = {
        type: "FeatureCollection",
        features: fieldsFC.features.map(f => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [f.properties.lon, f.properties.lat] },
          properties: f.properties,
        })),
      };

      /* ---- GRACE regional series (decoded from NASA GIBS) ---- */
      if (grace && grace.series) {
        const byY = {};
        grace.series.forEach(s => {
          if (s.cm != null) { const y = +s.d.slice(0, 4); (byY[y] = byY[y] || []).push(s.cm); }
        });
        const out = [];
        for (let y = 2002; y <= 2024; y++) {
          const arr = byY[y];
          out.push({
            y,
            v: arr && arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null,
            gap: (y === 2017 || y === 2018) || undefined,
          });
        }
        const obs = out.filter(d => d.v != null);
        if (obs.length >= 6) {
          M.grace = out;
          const tail = obs.slice(-8);
          const n = tail.length;
          const sx = tail.reduce((a, d) => a + d.y, 0), sy = tail.reduce((a, d) => a + d.v, 0);
          const sxy = tail.reduce((a, d) => a + d.y * d.v, 0), sxx = tail.reduce((a, d) => a + d.y * d.y, 0);
          const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx) || -0.8;
          const icpt = (sy - slope * sx) / n;
          const last = obs[obs.length - 1];
          M.graceForecast = [{ y: last.y, v: last.v }];
          for (let y = last.y + 1; y <= 2030; y++) M.graceForecast.push({ y, v: +(icpt + slope * y).toFixed(1) });
          M.graceThreshold = { yLow: 2028, yHigh: 2031, v: +(icpt + slope * 2029).toFixed(1) };
        }
        M.__graceMeta = grace;
      }

      /* ---- rainfall (NASA POWER, real) ---- */
      M.rain = rain;

      /* ---- impact: REAL detected consumption -> recoverable ranges ---- */
      const consLow = meta.est_m3_low / 1e6, consHigh = meta.est_m3_high / 1e6;
      const m3 = {
        conservative: +(consLow * 0.6).toFixed(1),
        mid: +(((consLow + consHigh) / 2) * 0.7).toFixed(1),
        high: +(consHigh * 0.8).toFixed(1),
        unit_ar: "مليون م³/سنة", unit_en: "M m³/yr",
      };
      M.impact = {
        m3,
        people: {
          conservative: Math.round(m3.conservative * 3730 / 1000),
          mid: Math.round(m3.mid * 3730 / 1000),
          high: Math.round(m3.high * 3730 / 1000),
          unit_ar: "ألف شخص·سنة", unit_en: "k person-yr",
        },
        dollars: {
          conservative: +(m3.conservative * 0.6).toFixed(1),
          mid: +(m3.mid * 0.75).toFixed(1),
          high: +(m3.high * 0.9).toFixed(1),
          unit_ar: "مليون دولار/سنة", unit_en: "M USD/yr",
        },
        carrier: M.impact.carrier,
      };

      /* ---- ledger pan2: anchor the detected-ET share with the real number ---- */
      M.ledger.detected_real = { low: +consLow.toFixed(1), high: +consHigh.toFixed(1) };

      M.validation = vs;
      M.__real = meta;

      /* ---- i18n patch ---- */
      Object.assign(window.MIZAN_I18N.ar, I18N_EXTRA.ar);
      Object.assign(window.MIZAN_I18N.en, I18N_EXTRA.en);
      const lastScene = (meta.scenes || []).map(s => s.date).sort().pop();
      if (lastScene) {
        window.MIZAN_I18N.ar.s1_update_val = lastScene;
        window.MIZAN_I18N.en.s1_update_val = lastScene;
      }
      console.info("MIZAN: REAL data loaded —", meta.n_fields, "fields,", meta.total_area_ha, "ha");
      return true;
    } catch (e) {
      Object.assign(window.MIZAN_I18N.ar, I18N_EXTRA.ar);
      Object.assign(window.MIZAN_I18N.en, I18N_EXTRA.en);
      console.warn("MIZAN: live data unavailable → demo fallback.", e.message);
      return false;
    }
  })();
})();
