/* ============================================================
   MIZAN — SVG charts. Time axis ALWAYS LTR (left→right),
   numerals Latin. Titles/tooltips localized by caller.
   ============================================================ */

/* generic scales */
function mkScale(d0, d1, r0, r1) {
  return v => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
}

/* animated path that draws on when `active` */
function DrawPath({ d, stroke, width = 2.5, dash, active, delay = 0, fill = "none", opacity = 1 }) {
  const ref = useRef(null);
  const [len, setLen] = useState(0);
  useEffect(() => {
    if (ref.current) setLen(ref.current.getTotalLength());
  }, [d]);
  const animatable = !dash && fill === "none";
  const style = animatable ? {
    strokeDasharray: len, strokeDashoffset: active ? 0 : len,
    transition: `stroke-dashoffset 1.1s cubic-bezier(.4,.6,.2,1) ${delay}s`,
  } : {};
  return <path ref={ref} d={d} stroke={stroke} strokeWidth={width} fill={fill}
    strokeDasharray={dash || style.strokeDasharray} style={animatable ? style : null}
    strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />;
}

/* ---------------- GRACE chart ---------------- */
function GraceChart({ active, lang, height = 300, showIrrigated, showDA }) {
  const t = getT(lang);
  const data = window.MIZAN_DATA.grace;
  const fc = window.MIZAN_DATA.graceForecast;
  const thr = window.MIZAN_DATA.graceThreshold;
  const W = 720, H = height;
  const m = { t: 22, r: 24, b: 36, l: 44 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = mkScale(2002, 2030, m.l, m.l + iw);
  /* dynamic y-domain (real series may exceed the design range) */
  const allV = data.filter(d => d.v != null).map(d => d.v).concat(fc.map(d => d.v)).concat([thr.v]);
  const yHi = Math.max(3, Math.ceil(Math.max(...allV) / 3) * 3);
  const yLo = Math.min(-21, Math.floor(Math.min(...allV) / 3) * 3);
  const y = mkScale(yHi, yLo, m.t, m.t + ih);
  // irrigated hectares (secondary, rising) — normalized to chart band
  const yIrr = mkScale(0, 100, m.t + ih, m.t + ih * 0.35);
  const irrPts = [[2002,8],[2006,12],[2010,22],[2014,38],[2019,58],[2022,76],[2024,90]];
  const irrLine = irrPts.map((p,i)=>`${i?"L":"M"}${x(p[0]).toFixed(1)},${yIrr(p[1]).toFixed(1)}`).join(" ");
  const obs = data.filter(d => d.v !== null);
  const line = obs.map((d, i) => `${i ? "L" : "M"}${x(d.y).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const last = obs[obs.length - 1];
  const fcLine = fc.map((d, i) => `${i ? "L" : "M"}${x(d.y).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(last.y)},${y(yLo)} L${x(obs[0].y)},${y(yLo)} Z`;
  const [hover, setHover] = useState(null);

  const yticks = [0, 1, 2, 3, 4].map(i => Math.round(yHi - (i * (yHi - yLo)) / 4));
  const xticks = [2002, 2008, 2014, 2020, 2024, 2030];

  return (
    <div style={{ position: "relative", direction: "ltr" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="grace-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--danger)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--danger)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grace-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="0.6" stopColor="var(--warning)" />
            <stop offset="1" stopColor="var(--danger)" />
          </linearGradient>
          <pattern id="gap-hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="7" height="7" fill="rgba(148,163,184,.05)" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(148,163,184,.30)" strokeWidth="1.4" />
          </pattern>
        </defs>

        {/* gridlines */}
        {yticks.map(v => (
          <g key={v}>
            <line x1={m.l} y1={y(v)} x2={m.l + iw} y2={y(v)} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={m.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-3)" fontFamily="var(--font-num)">{v}</text>
          </g>
        ))}
        <line x1={m.l} y1={y(0)} x2={m.l + iw} y2={y(0)} stroke="var(--line-strong)" />
        {xticks.map(v => (
          <text key={v} x={x(v)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--text-3)" fontFamily="var(--font-num)">{v}</text>
        ))}

        {/* GRACE gap band 2017-2018 */}
        <rect x={x(2016.6)} y={m.t} width={x(2018.4) - x(2016.6)} height={ih} fill="url(#gap-hatch)" />
        <text x={(x(2017) + x(2018)) / 2} y={m.t + 12} textAnchor="middle" fontSize="9.5" fill="var(--text-3)" fontFamily="var(--font-num)">2017–18</text>

        {/* threshold window */}
        <rect x={x(thr.yLow)} y={m.t} width={x(thr.yHigh) - x(thr.yLow)} height={ih} fill="rgba(239,68,68,.10)" stroke="rgba(239,68,68,.35)" strokeDasharray="3 3" />

        {/* GRACE-DA derived band (toggle) */}
        {showDA && (
          <g style={{ animation: "fadeIn .4s ease" }}>
            <defs>
              <linearGradient id="da-band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--info)" stopOpacity="0.16" />
                <stop offset="1" stopColor="var(--info)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <rect x={m.l} y={m.t} width={iw} height={ih} fill="url(#da-band)" />
            <text x={m.l + 8} y={m.t + 14} fontSize="9.5" fill="var(--info)" fontFamily="var(--font-num)" style={{ direction: t.dir }}>GRACE-DA</text>
          </g>
        )}

        {/* area + lines */}
        <path d={area} fill="url(#grace-area)" opacity={active ? 1 : 0} style={{ transition: "opacity .8s ease .5s" }} />
        <DrawPath d={line} stroke="url(#grace-stroke)" width={3} active={active} />
        <DrawPath d={fcLine} stroke="var(--danger)" width={2.4} dash="6 6" active={active} opacity={0.85} />

        {/* irrigated hectares overlay (toggle) */}
        {showIrrigated && (
          <g style={{ animation: "fadeIn .4s ease" }}>
            <DrawPath d={irrLine} stroke="var(--healthy)" width={2} dash="1 5" active={active} opacity={0.9} />
            {irrPts.map((p,i)=><circle key={i} cx={x(p[0])} cy={yIrr(p[1])} r="2.5" fill="var(--healthy)" />)}
          </g>
        )}

        {/* gap connector dotted (data-driven endpoints) */}
        {(() => {
          const a = data.find(d => d.y === 2016 && d.v != null), b = data.find(d => d.y === 2019 && d.v != null);
          return a && b ? <line x1={x(2016)} y1={y(a.v)} x2={x(2019)} y2={y(b.v)} stroke="var(--text-3)" strokeDasharray="2 4" strokeWidth="1.5" /> : null;
        })()}

        {/* threshold flashing point */}
        <g style={{ animation: active ? "blink 1.4s infinite" : "none" }}>
          <circle cx={x((thr.yLow + thr.yHigh) / 2)} cy={y(thr.v)} r="6" fill="var(--danger)" />
          <circle cx={x((thr.yLow + thr.yHigh) / 2)} cy={y(thr.v)} r="6" fill="none" stroke="var(--danger)" strokeWidth="2">
            <animate attributeName="r" values="6;15;6" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* hover points */}
        {obs.map(d => (
          <g key={d.y}>
            <circle cx={x(d.y)} cy={y(d.v)} r="11" fill="transparent"
              onMouseEnter={() => setHover(d)} style={{ cursor: "crosshair" }} />
            {hover && hover.y === d.y && <circle cx={x(d.y)} cy={y(d.v)} r="4.5" fill="var(--text)" stroke="var(--danger)" strokeWidth="2" />}
          </g>
        ))}
      </svg>

      {hover && (
        <div style={{
          position: "absolute", top: 8, insetInlineEnd: 12, pointerEvents: "none",
          background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8,
          padding: "6px 10px", fontSize: 12, color: "var(--text)", direction: t.dir,
        }}>
          <b className="num" style={{ fontFamily: "var(--font-num)" }}>{hover.y}</b>
          <span style={{ color: "var(--text-2)", marginInlineStart: 8 }}>{hover.v} cm</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- NDVI chart ---------------- */
function NdviChart({ active, lang, height = 170, series }) {
  const data = (series && series.length ? series : window.MIZAN_DATA.ndvi);
  const W = 460, H = height;
  const m = { t: 14, r: 14, b: 26, l: 30 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = mkScale(Math.min(2016, data[0].y), Math.max(2026, data[data.length - 1].y), m.l, m.l + iw);
  const y = mkScale(0, Math.max(0.8, ...data.map(d => d.v)), m.t + ih, m.t);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(d.y).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(2026)},${y(0)} L${x(2016)},${y(0)} Z`;
  const [hover, setHover] = useState(null);

  return (
    <div style={{ position: "relative", direction: "ltr" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="ndvi-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--healthy)" stopOpacity="0.30" />
            <stop offset="1" stopColor="var(--healthy)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.4, 0.8].map(v => (
          <g key={v}>
            <line x1={m.l} y1={y(v)} x2={m.l + iw} y2={y(v)} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={m.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="var(--font-num)">{v.toFixed(1)}</text>
          </g>
        ))}
        {[2016, 2020, 2023, 2026].map(v => (
          <text key={v} x={x(v)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontFamily="var(--font-num)">{v}</text>
        ))}
        <path d={area} fill="url(#ndvi-area)" opacity={active ? 1 : 0} style={{ transition: "opacity .8s ease .4s" }} />
        <DrawPath d={line} stroke="var(--healthy)" width={2.6} active={active} />
        {data.map(d => (
          <g key={d.y}>
            <circle cx={x(d.y)} cy={y(d.v)} r="9" fill="transparent" onMouseEnter={() => setHover(d)} style={{ cursor: "crosshair" }} />
            {hover && hover.y === d.y && <circle cx={x(d.y)} cy={y(d.v)} r="4" fill="var(--healthy)" stroke="#fff" strokeWidth="1.5" />}
          </g>
        ))}
      </svg>
      {hover && (
        <div style={{ position: "absolute", top: 6, insetInlineStart: 36, pointerEvents: "none", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "4px 9px", fontSize: 11.5 }}>
          <b className="num">{hover.y}</b><span style={{ color: "var(--text-2)", marginInlineStart: 6 }}>NDVI {hover.v.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Compare bar (carrier vs recovered) ---------------- */
function CompareBar({ active, lang }) {
  const t = getT(lang);
  const imp = window.MIZAN_DATA.impact;
  const carrier = imp.carrier.value;          // 300
  const recLow = imp.m3.conservative, recHigh = imp.m3.high; // 150..250
  const pctLow = recLow / carrier * 100, pctHigh = recHigh / carrier * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Bar label={t.s4_carrier} valueNode={<span><span className="num">{D(carrier, lang, true)}</span> {imp.carrier.unit_ar && lang === "ar" ? imp.carrier.unit_ar : imp.carrier.unit_en}</span>}
        pct={100} color="var(--surface-3)" active={active} sub={lang === "ar" ? imp.carrier.cost_ar : imp.carrier.cost_en} />
      <Bar label={t.s4_recovered}
        valueNode={<span><span className="num">{D(recLow, lang, true)}–{D(recHigh, lang, true)}</span> {lang === "ar" ? imp.m3.unit_ar : imp.m3.unit_en}</span>}
        pct={pctHigh} pctLow={pctLow} color="var(--accent)" active={active} demo lang={lang} />
    </div>
  );
}
function Bar({ label, valueNode, pct, pctLow, color, active, sub, demo, lang }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7, gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14 }}>
          {label}{demo && <DataBadge lang={lang} small />}
        </span>
        <span style={{ color: "var(--text)", fontWeight: 800, fontFamily: "var(--font-num)", fontSize: 15 }}>{valueNode}</span>
      </div>
      <div style={{ height: 22, background: "var(--surface-1)", borderRadius: 6, position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}>
        {pctLow != null && (
          <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: active ? `${pctLow}%` : 0, background: "repeating-linear-gradient(45deg, rgba(45,212,191,.25), rgba(45,212,191,.25) 6px, transparent 6px, transparent 12px)", transition: "width 1s ease .3s" }} />
        )}
        <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: active ? `${pct}%` : 0, background: color, opacity: pctLow != null ? 0.55 : 1, borderRadius: 5, transition: "width 1.1s cubic-bezier(.4,.6,.2,1) .2s" }} />
      </div>
      {sub && <div style={{ marginTop: 5, fontSize: 11.5, color: "var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { GraceChart, NdviChart, CompareBar });
