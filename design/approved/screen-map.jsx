/* ============================================================
   MIZAN — Screen 1: National map (opening)
   ============================================================ */

function ScreenMap({ lang, onNav, loading }) {
  const t = getT(lang);
  const D2 = window.MIZAN_DATA;
  const [layers, setLayers] = useState({ basins: true, heat: true, dots: true });
  const toggle = k => setLayers(s => ({ ...s, [k]: !s[k] }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "366px 1fr", height: "100%", gap: 0 }}>
      {/* ---- Side rail (inline-start → right in RTL) ---- */}
      <aside style={{ borderInlineEnd: "1px solid var(--line)", padding: "var(--s6)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--s4)", background: "linear-gradient(180deg, rgba(17,24,39,.5), transparent 40%)" }}>
        <div className="animate-rise">
          <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 6 }}>{t.navNum.map} · {t.nav.map}</div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>{t.s1_title}</h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.5 }}>{t.s1_sub}</p>
        </div>

        {/* key stats */}
        <div style={{ display: "grid", gap: "var(--s3)" }}>
          <div className="animate-rise" style={{ animationDelay: ".05s" }}>
            <StatTile icon="flag" label={t.s1_redflags} sub={t.s1_redflags_sub} accent="var(--danger)" demo lang={lang}
              valueNode={<div className="stat-big" style={{ fontSize: 40, color: "var(--danger)" }}>{D(23, lang)}</div>} />
          </div>
          <div className="animate-rise" style={{ animationDelay: ".1s" }}>
            <StatTile icon="drop" label={t.s1_m3} sub={t.s1_m3_sub} demo lang={lang}
              valueNode={<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="stat-big" style={{ fontSize: 38 }}>{D(4, lang)}–{D(6, lang)}</span>
                <span style={{ color: "var(--text-2)", fontWeight: 700, fontFamily: "var(--font-head)", fontSize: 14 }}>{lang === "ar" ? "مليون م³/سنة" : "M m³/yr"}</span>
              </div>} />
          </div>
          <div className="animate-rise" style={{ animationDelay: ".15s" }}>
            <StatTile icon="clock" label={t.s1_update} accent="var(--accent-2)" lang={lang}
              valueNode={<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="stat-big" style={{ fontSize: 26 }}>{t.s1_update_val}</span>
                <span className="badge" style={{ background: "rgba(34,211,238,.12)", color: "var(--accent-2)", borderColor: "rgba(34,211,238,.3)", fontSize: 11 }}>{t.s1_update_src}</span>
              </div>} />
          </div>
        </div>

        {/* stressed basins */}
        <div className="hud-panel animate-rise" style={{ animationDelay: ".2s", padding: 0 }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }} className="eyebrow">{t.s1_basins_stressed}</div>
          <div>
            {D2.basins.map((b, i) => {
              const g = window.GRADE[b.status === "critical" ? "critical" : "stressed"];
              return (
                <button key={b.id} onClick={() => onNav("basin", { basin: b.id })}
                  style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", background: "transparent", border: "none", borderTop: i ? "1px solid var(--line)" : "none", cursor: "pointer", textAlign: "start", color: "var(--text)" }}>
                  <GradeDot grade={b.status === "critical" ? "critical" : "stressed"} size={11} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14 }}>{lang === "ar" ? b.name_ar : b.name_en}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{lang === "ar" ? b.health_ar : b.health_en}</div>
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div className="num" style={{ fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 18, color: g.color }}>{D(b.pumping, lang, true)}%</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>{t.pumpOf}</div>
                  </div>
                  <span style={{ color: "var(--text-3)", display: "flex" }} className="rtl-flip"><Icon name="chevron" size={16} /></span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => onNav("queue")} style={{ width: "100%" }}>
            <Icon name="grid" size={16} />{t.s1_openQueue}<span className="rtl-flip" style={{ display: "flex" }}><Icon name="arrow" size={16} /></span>
          </button>
        </div>
      </aside>

      {/* ---- Map stage ---- */}
      <div style={{ position: "relative", overflow: "hidden", background: "radial-gradient(900px 700px at 60% 40%, rgba(15,30,52,.6), var(--bg-deep))" }}>
        <JordanMap lang={lang} layers={layers} loading={loading}
          onBasin={b => onNav("basin", { basin: b.id })}
          onField={f => onNav("queue", { focus: f.rank })} />

        {/* top overlay: region badge + demo */}
        <div style={{ position: "absolute", top: 16, insetInlineStart: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <span className="badge badge-region"><Icon name="globe" size={13} />{t.regionalSignal}</span>
          <DemoBadge lang={lang} />
        </div>

        {/* legend */}
        <div className="hud-panel" style={{ position: "absolute", bottom: 16, insetInlineStart: 16, width: 230, padding: 0 }}>
          <div className="eyebrow" style={{ padding: "10px 14px 6px" }}>{t.s1_legend}</div>
          <div style={{ padding: "0 8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            <LayerChip active={layers.basins} onClick={() => toggle("basins")} color="var(--danger)">{t.s1_basinHealth}</LayerChip>
            <LayerChip active={layers.heat} onClick={() => toggle("heat")} color="var(--warning)">{t.s1_heat}</LayerChip>
            <LayerChip active={layers.dots} onClick={() => toggle("dots")} color="var(--accent)">{t.s1_candidates}</LayerChip>
          </div>
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--line)", display: "flex", gap: 14, fontSize: 11, color: "var(--text-2)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><GradeDot grade="critical" />🔴</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><GradeDot grade="stressed" />🟠</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><GradeDot grade="healthy" />🟢</span>
          </div>
        </div>

        {/* scale note */}
        <div style={{ position: "absolute", bottom: 18, insetInlineEnd: 18, fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-num)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 40, height: 1, background: "var(--text-3)", display: "inline-block" }} />~50 km
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenMap });
