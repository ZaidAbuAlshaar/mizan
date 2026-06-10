/* ============================================================
   MIZAN — Screen 2: Basin detail (GRACE + ledger + time machine)
   ============================================================ */

/* ---- Balance ledger (two pans) ---- */
function BalanceLedger({ lang }) {
  const t = getT(lang);
  const L = window.MIZAN_DATA.ledger;
  const [on, setOn] = useState(false);
  useEffect(() => { const id = setTimeout(() => setOn(true), 300); return () => clearTimeout(id); }, []);
  const tilt = on ? 8 : 0; // pan1 heavier → beam tilts

  return (
    <div className="hud-panel ticked" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="scale" size={18} style={{ color: "var(--accent)" }} />
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 17 }}>{t.ledger_title}</span>
        </div>
        <DemoBadge lang={lang} small />
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 6 }}>{t.ledger_eq}</div>

      {/* balance visual */}
      <svg viewBox="0 0 360 150" width="100%" style={{ display: "block", direction: "ltr" }}>
        <line x1="180" y1="20" x2="180" y2="118" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" />
        <polygon points="180,118 168,134 192,134" fill="var(--surface-3)" stroke="var(--line-strong)" />
        <g style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "180px 28px", transition: "transform 1s cubic-bezier(.4,.6,.2,1)" }}>
          <line x1="60" y1="28" x2="300" y2="28" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="180" cy="28" r="5" fill="var(--accent)" />
          {/* pan 1 (left, heavier) */}
          <PanG x={60} y={28} drop={34} color="var(--danger)" />
          {/* pan 2 (right, lighter) */}
          <PanG x={300} y={28} drop={18} color="var(--healthy)" />
        </g>
      </svg>

      {/* numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
        <PanCard tag={t.ledger_pan1} label={lang === "ar" ? L.pan1.label_ar : L.pan1.label_en} low={L.pan1.low} high={L.pan1.high} unit={t.mm3yr} color="var(--danger)" lang={lang} />
        <PanCard tag={t.ledger_pan2} label={lang === "ar" ? L.pan2.label_ar : L.pan2.label_en} low={L.pan2.low} high={L.pan2.high} unit={t.mm3yr} color="var(--healthy)" lang={lang} />
      </div>

      {/* deficit */}
      <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--danger)" }}>{t.ledger_deficit}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2 }}>{lang === "ar" ? "= فقد مقيس − مُفسَّر" : "= measured − explained"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="stat-big" style={{ fontSize: 34, color: "var(--danger)" }}>≈{D(L.deficit.low, lang, true)}–{D(L.deficit.high, lang, true)}</span>
          <span style={{ color: "var(--text-2)", fontSize: 12.5, fontWeight: 700, fontFamily: "var(--font-head)" }}>{t.mm3}</span>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}><RegionBadge lang={lang} /></div>
    </div>
  );
}
function PanG({ x, y, drop, color }) {
  const py = y + drop;
  return (
    <g style={{ transition: "all 1s ease" }}>
      <line x1={x} y1={y} x2={x - 18} y2={py} stroke="var(--line-strong)" strokeWidth="1.5" />
      <line x1={x} y1={y} x2={x + 18} y2={py} stroke="var(--line-strong)" strokeWidth="1.5" />
      <path d={`M${x - 22},${py} a22,8 0 0,0 44,0`} fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.8" />
    </g>
  );
}
function PanCard({ tag, label, low, high, unit, color, lang }) {
  return (
    <div className="hud-panel" style={{ padding: "12px 13px", background: "rgba(17,24,39,.5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: color }} />
        <span className="eyebrow" style={{ color }}>{tag}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.4, marginBottom: 8, minHeight: 32 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span className="stat-big" style={{ fontSize: 26, color: "var(--text)" }}>{D(low, lang, true)}–{D(high, lang, true)}</span>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>{unit}</div>
    </div>
  );
}

/* ---- Basin time machine ---- */
function TimeMachine({ lang }) {
  const t = getT(lang);
  const [year, setYear] = useState(2016);
  const [playing, setPlaying] = useState(false);
  const prog = (year - 2016) / 10; // 0..1
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setYear(y => { if (y >= 2026) { setPlaying(false); return 2026; } return y + 1; }), 380);
    return () => clearInterval(id);
  }, [playing]);

  // pivot circles that "grow in" as year advances
  const pivots = [
    { cx: 28, cy: 35, r: 7, on: 2018 }, { cx: 52, cy: 58, r: 9, on: 2020 },
    { cx: 70, cy: 30, r: 6, on: 2021 }, { cx: 40, cy: 72, r: 8, on: 2019 },
    { cx: 82, cy: 62, r: 7, on: 2023 }, { cx: 60, cy: 80, r: 6, on: 2024 },
    { cx: 22, cy: 58, r: 5, on: 2022 }, { cx: 88, cy: 40, r: 6, on: 2025 },
  ];

  return (
    <div className="hud-panel" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name="history" size={17} style={{ color: "var(--accent-2)" }} />
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>{t.timemachine}</span>
        </div>
        <DemoBadge lang={lang} small />
      </div>

      {/* scene */}
      <div style={{ position: "relative", aspectRatio: "16/9", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)", direction: "ltr" }}>
        <image-slot id="basin-2016" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 1 - prog }} shape="rect" fit="cover" placeholder={lang === "ar" ? "صورة الحوض ٢٠١٦" : "Basin 2016"}></image-slot>
        <image-slot id="basin-2026" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: prog }} shape="rect" fit="cover" placeholder={lang === "ar" ? "صورة الحوض ٢٠٢٦" : "Basin 2026"}></image-slot>
        {/* desert→green pivot overlay (drawn over slots so it works without imagery) */}
        <svg viewBox="0 0 110 100" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "screen", pointerEvents: "none" }}>
          {pivots.map((p, i) => {
            const vis = year >= p.on;
            return <circle key={i} cx={p.cx} cy={p.cy} r={vis ? p.r : 0} fill="var(--healthy)" fillOpacity="0.55" stroke="var(--healthy)" strokeWidth="0.6" style={{ transition: "r .5s cubic-bezier(.2,.8,.2,1)" }} />;
          })}
        </svg>
        {/* year badge */}
        <div style={{ position: "absolute", top: 10, insetInlineStart: 10, fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 22, color: "#fff", background: "rgba(7,16,31,.7)", padding: "4px 12px", borderRadius: 8, border: "1px solid var(--line-strong)" }} className="num">{year}</div>
        <div style={{ position: "absolute", bottom: 10, insetInlineEnd: 10 }}><RegionBadge lang={lang} /></div>
      </div>

      {/* slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button className="btn btn-sm" onClick={() => { if (year >= 2026) setYear(2016); setPlaying(p => !p); }} style={{ padding: 8, flex: "none" }}>
          {playing ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z" /></svg>}
        </button>
        <span className="num" style={{ fontFamily: "var(--font-num)", fontSize: 12, color: "var(--text-3)", flex: "none" }}>2016</span>
        <input type="range" min="2016" max="2026" value={year} onChange={e => { setPlaying(false); setYear(+e.target.value); }}
          style={{ flex: 1, accentColor: "var(--accent)", direction: "ltr" }} />
        <span className="num" style={{ fontFamily: "var(--font-num)", fontSize: 12, color: "var(--text-3)", flex: "none" }}>2026</span>
      </div>
    </div>
  );
}

/* ---- Screen ---- */
function ScreenBasin({ lang, onNav }) {
  const t = getT(lang);
  const [ov, setOv] = useState({ irrigated: false, da: false });

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--s6)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 6 }}>{t.navNum.basin} · {t.nav.basin}</div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800 }}>{t.s2_title}</h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-2)", fontSize: 13.5 }}>{t.s2_sub}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}><RegionBadge lang={lang} /><DemoBadge lang={lang} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s5)", alignItems: "start" }}>
        {/* GRACE half */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
          <div className="hud-panel ticked" style={{ padding: 0 }}>
            <header style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Icon name="pulse" size={18} style={{ color: "var(--danger)" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16 }}>{t.grace_title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t.grace_sub}</div>
                  </div>
                </div>
                <RegionBadge lang={lang} />
              </div>
            </header>
            <div style={{ padding: 14 }}>
              <GraceChart active={true} lang={lang} showIrrigated={ov.irrigated} showDA={ov.da} />
              {/* legend + overlay toggles */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 12, alignItems: "center" }}>
                <Legend color="var(--accent)" line>{t.grace_observed}</Legend>
                <Legend color="var(--danger)" dash>{t.grace_forecast}</Legend>
                <Legend color="var(--danger)" pulse>{t.grace_threshold}</Legend>
                <Legend color="var(--text-3)" hatch>{t.grace_gap}</Legend>
                <div style={{ flex: 1 }} />
                <OverlayToggle on={ov.irrigated} color="var(--healthy)" onClick={() => setOv(s => ({ ...s, irrigated: !s.irrigated }))}>{t.irrigated_overlay}</OverlayToggle>
                <OverlayToggle on={ov.da} color="var(--info)" onClick={() => setOv(s => ({ ...s, da: !s.da }))}>{t.grace_da}</OverlayToggle>
              </div>
            </div>
          </div>
          <BalanceLedger lang={lang} />
        </div>

        {/* map + time machine half */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
          <div className="hud-panel" style={{ padding: 0, overflow: "hidden", position: "relative", height: 300 }}>
            <JordanMap lang={lang} layers={{ basins: true, heat: true, dots: true }} activeBasin="azraq" focusField={{ rank: 1 }} />
            <div style={{ position: "absolute", top: 12, insetInlineStart: 12 }}><span className="badge badge-region"><Icon name="target" size={13} />{lang === "ar" ? "حوض الأزرق" : "Azraq basin"}</span></div>
          </div>
          <TimeMachine lang={lang} />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, children, line, dash, pulse, hatch }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-2)" }}>
      <svg width="20" height="10" style={{ flex: "none" }}>
        {hatch ? <rect width="20" height="10" fill="rgba(148,163,184,.25)" />
          : <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="2.5" strokeDasharray={dash ? "4 3" : "none"} strokeLinecap="round" />}
        {pulse && <circle cx="10" cy="5" r="3" fill={color} />}
      </svg>
      {children}
    </span>
  );
}
function OverlayToggle({ on, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 11px", borderRadius: "var(--r-pill)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)", background: on ? "rgba(255,255,255,.05)" : "transparent", border: `1px solid ${on ? color : "var(--line)"}`, color: on ? "var(--text)" : "var(--text-3)", transition: "all .15s" }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, opacity: on ? 1 : .35 }} />{children}
    </button>
  );
}

Object.assign(window, { ScreenBasin, BalanceLedger, TimeMachine });
