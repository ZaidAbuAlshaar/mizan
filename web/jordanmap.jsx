/* ============================================================
   MIZAN — Stylized dark Jordan map (pure SVG, zero network).
   Projection: simple equirect with lon scaled for aspect.
   ============================================================ */

const JO = (() => {
  const lonMin = 34.8, lonMax = 39.4, latMin = 29.0, latMax = 33.5;
  const cos = Math.cos(31 * Math.PI / 180);
  const k = 210;
  const W = (lonMax - lonMin) * cos * k;   // ~ 833
  const H = (latMax - latMin) * k;          // ~ 945
  const px = lon => (lon - lonMin) / (lonMax - lonMin) * W;
  const py = lat => (latMax - lat) / (latMax - latMin) * H;
  const path = pts => pts.map((p, i) => `${i ? "L" : "M"}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ") + " Z";
  return { W, H, px, py, path };
})();

// Jordan silhouette (approx, clockwise from NW). Stylized — not survey-grade.
const JORDAN_BORDER = [
  [35.55, 32.38], [36.40, 32.72], [38.20, 32.34], [39.05, 32.00],
  [37.10, 30.05], [37.00, 29.55], [36.72, 29.18], [35.10, 29.50],
  [34.96, 29.40], [35.10, 30.45], [35.45, 31.45], [35.52, 31.78],
  [35.58, 32.12],
];

const CITIES = [
  { name_ar: "عمّان", name_en: "Amman", lon: 35.93, lat: 31.95, cap: true },
  { name_ar: "إربد", name_en: "Irbid", lon: 35.85, lat: 32.55 },
  { name_ar: "الزرقاء", name_en: "Zarqa", lon: 36.09, lat: 32.07 },
  { name_ar: "الأزرق", name_en: "Azraq", lon: 36.82, lat: 31.83 },
  { name_ar: "العقبة", name_en: "Aqaba", lon: 35.00, lat: 29.53 },
];

function JordanMap({ lang, layers = { basins: true, heat: true, dots: true }, onBasin, onField, activeBasin, focusField, loading }) {
  const t = getT(lang);
  const D2 = window.MIZAN_DATA;
  const { W, H, px, py, path } = JO;

  if (loading) {
    return <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="skeleton" style={{ width: "55%", height: "78%", borderRadius: 20, opacity: .5 }} />
    </div>;
  }

  return (
    <svg viewBox={`-20 -20 ${W + 40} ${H + 40}`} width="100%" height="100%"
      preserveAspectRatio="xMidYMid meet" style={{ display: "block", direction: "ltr" }}>
      <defs>
        <radialGradient id="jo-fill" cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor="#15233b" />
          <stop offset="1" stopColor="#0c1729" />
        </radialGradient>
        <filter id="jo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="heat-r" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--danger)" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--warning)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--warning)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="jo-clip"><path d={path(JORDAN_BORDER)} /></clipPath>
      </defs>

      {/* graticule */}
      <g opacity="0.5" clipPath="url(#jo-clip)">
        {[35, 36, 37, 38, 39].map(l => <line key={"v" + l} x1={px(l)} y1={0} x2={px(l)} y2={H} stroke="rgba(148,163,184,.10)" strokeWidth="1" />)}
        {[30, 31, 32, 33].map(l => <line key={"h" + l} x1={0} y1={py(l)} x2={W} y2={py(l)} stroke="rgba(148,163,184,.10)" strokeWidth="1" />)}
      </g>

      {/* country glow + fill */}
      <path d={path(JORDAN_BORDER)} fill="url(#jo-fill)" stroke="var(--accent-line)" strokeWidth="1.6"
        filter="url(#jo-glow)" className="animate-fade" />
      <path d={path(JORDAN_BORDER)} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />

      <g clipPath="url(#jo-clip)">
        {/* basin regions */}
        {layers.basins && D2.basins.map((b, i) => {
          const g = window.GRADE[b.status === "critical" ? "critical" : "stressed"];
          const isActive = activeBasin === b.id;
          const fill = b.pumping >= 200 ? "var(--danger-deeper)" : b.pumping >= 170 ? "var(--danger-deep)" : "var(--warning-deep)";
          return (
            <g key={b.id} onClick={() => onBasin && onBasin(b)} style={{ cursor: onBasin ? "pointer" : "default" }}>
              <path d={path(b.poly)} fill={fill}
                fillOpacity={isActive ? 0.92 : 0.7}
                stroke={g.color} strokeWidth={isActive ? 2.4 : 1.4}
                style={{ transition: "all .3s ease" }} />
              <path d={path(b.poly)} fill="none" stroke={g.color} strokeWidth="1" strokeDasharray="3 4" opacity={isActive ? 0.9 : 0} />
            </g>
          );
        })}

        {/* heat blobs */}
        {layers.heat && D2.fields.filter(f => f.grade !== "healthy").map((f, i) => (
          <circle key={"h" + i} cx={px(f.lon)} cy={py(f.lat)} r={f.grade === "critical" ? 58 : 40}
            fill="url(#heat-r)" style={{ mixBlendMode: "screen" }} />
        ))}
      </g>

      {/* basin labels */}
      {layers.basins && D2.basins.map(b => (
        <g key={"l" + b.id} style={{ pointerEvents: "none" }}>
          <text x={px(b.label_at[0])} y={py(b.label_at[1])} textAnchor="middle"
            fontFamily="var(--font-head)" fontWeight="700" fontSize="15" fill="#fff"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.5)", strokeWidth: 3 }}>
            {lang === "ar" ? b.name_ar : b.name_en}
          </text>
          <text x={px(b.label_at[0])} y={py(b.label_at[1]) + 16} textAnchor="middle"
            fontFamily="var(--font-num)" fontWeight="800" fontSize="13"
            fill={window.GRADE[b.status === "critical" ? "critical" : "stressed"].color}
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.5)", strokeWidth: 3 }}>
            {b.pumping}%
          </text>
        </g>
      ))}

      {/* cities */}
      {CITIES.map(c => (
        <g key={c.name_en} style={{ pointerEvents: "none", opacity: 0.85 }}>
          {c.cap
            ? <path d={`M${px(c.lon)},${py(c.lat) - 5} l1.5,3.2 3.5,.3 -2.7,2.3 .9,3.4 -3.2,-1.9 -3.2,1.9 .9,-3.4 -2.7,-2.3 3.5,-.3 z`} fill="#cbd5e1" />
            : <circle cx={px(c.lon)} cy={py(c.lat)} r="2" fill="#94a3b8" />}
          <text x={px(c.lon)} y={py(c.lat) + (c.cap ? 16 : 13)} textAnchor="middle"
            fontFamily="var(--font-body)" fontSize={c.cap ? 11 : 9.5} fill="#94a3b8"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.6)", strokeWidth: 2.5 }}>
            {lang === "ar" ? c.name_ar : c.name_en}
          </text>
        </g>
      ))}

      {/* candidate dots */}
      {layers.dots && D2.fields.map((f, i) => {
        const g = window.GRADE[f.grade];
        const isFocus = focusField && focusField.rank && f.rank === focusField.rank;
        const top = f.rank && f.rank <= 2;
        return (
          <g key={"d" + i} onClick={() => onField && f.rank && onField(f)} style={{ cursor: f.rank && onField ? "pointer" : "default" }}>
            {top && <circle cx={px(f.lon)} cy={py(f.lat)} r="9" fill={g.color} opacity="0.3">
              <animate attributeName="r" values="6;13;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
            </circle>}
            <circle cx={px(f.lon)} cy={py(f.lat)} r={isFocus ? 7 : f.rank ? 5.5 : 4}
              fill={g.color} stroke={isFocus ? "#fff" : "rgba(0,0,0,.4)"} strokeWidth={isFocus ? 2 : 1}
              style={{ filter: `drop-shadow(0 0 5px ${g.color})` }} />
            {f.rank && f.rank <= 3 && (
              <text x={px(f.lon)} y={py(f.lat) - 11} textAnchor="middle" fontFamily="var(--font-num)" fontWeight="800" fontSize="11" fill="#fff"
                style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.6)", strokeWidth: 3 }}>{f.rank}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { JordanMap, JO, CITIES });
