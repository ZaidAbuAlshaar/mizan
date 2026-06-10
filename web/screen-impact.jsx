/* ============================================================
   MIZAN — Screen 4: Impact counter (ranges, stated assumptions)
   ============================================================ */

function ImpactCard({ icon, label, data, unit, assume, lang, accent, delay }) {
  const t = getT(lang);
  const [on, setOn] = useState(false);
  useEffect(() => { const id = setTimeout(() => setOn(true), delay); return () => clearTimeout(id); }, []);
  const midPct = (data.mid - data.conservative) / (data.high - data.conservative) * 100;

  return (
    <div className="hud-panel ticked animate-rise" style={{ padding: "22px 22px 18px", animationDelay: `${delay / 1000}s`, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--text-2)" }}>
          <span style={{ color: accent, display: "flex" }}><Icon name={icon} size={18} /></span>
          <span className="eyebrow" style={{ color: "var(--text-2)", fontSize: 12 }}>{label}</span>
        </span>
        <DataBadge lang={lang} small />
      </div>

      {/* big range */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span className="stat-big" style={{ fontSize: 58, color: accent }}>{D(data.conservative, lang, true)}</span>
          <span style={{ color: "var(--text-3)", fontSize: 34, fontWeight: 800, fontFamily: "var(--font-num)" }}>–</span>
          <span className="stat-big" style={{ fontSize: 58, color: accent }}>{D(data.high, lang, true)}</span>
        </div>
        <div style={{ color: "var(--text-2)", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-head)", marginTop: 2 }}>{unit}</div>
      </div>

      {/* range track with conservative / mid / high */}
      <div style={{ marginTop: 2 }}>
        <div style={{ position: "relative", height: 8, background: "var(--surface-1)", borderRadius: 5, border: "1px solid var(--line)", overflow: "visible" }}>
          <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: on ? "100%" : 0, background: `linear-gradient(90deg, ${accent}66, ${accent})`, borderRadius: 5, transition: "width 1s cubic-bezier(.4,.6,.2,1) .15s" }} />
          {/* mid marker */}
          <div style={{ position: "absolute", top: -4, insetInlineStart: `${midPct}%`, width: 2, height: 16, background: "#fff", transform: "translateX(-1px)", opacity: on ? 1 : 0, transition: "opacity .4s ease .9s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5 }}>
          <Tick label={t.conservative} value={D(data.conservative, lang, true)} />
          <Tick label={t.mid} value={D(data.mid, lang, true)} center />
          <Tick label={t.high} value={D(data.high, lang, true)} end />
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--line)", fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5, display: "flex", gap: 7 }}>
        <Icon name="alert" size={14} style={{ flex: "none", marginTop: 1, color: "var(--demo)" }} />
        <span>{assume}</span>
      </div>
    </div>
  );
}
function Tick({ label, value, center, end }) {
  return (
    <div style={{ textAlign: center ? "center" : end ? "end" : "start" }}>
      <div style={{ color: "var(--text-2)", fontWeight: 700, fontFamily: "var(--font-head)" }}>{label}</div>
      <div className="num" style={{ color: "var(--text)", fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 13 }}>{value}</div>
    </div>
  );
}

function ScreenImpact({ lang, onNav }) {
  const t = getT(lang);
  const imp = window.MIZAN_DATA.impact;
  const u = (a, e) => (lang === "ar" ? a : e);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--s8)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 6 }}>{t.navNum.impact} · {t.nav.impact}</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800 }}>{t.s4_title}</h1>
            <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 14, maxWidth: 720, lineHeight: 1.5 }}>{t.s4_sub}</p>
          </div>
          <DataBadge lang={lang} />
        </div>

        {/* three big cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--s5)" }}>
          <ImpactCard icon="drop" label={t.s4_m3} data={imp.m3} unit={u(imp.m3.unit_ar, imp.m3.unit_en)} assume={t.assume_m3} lang={lang} accent="var(--accent)" delay={0} />
          <ImpactCard icon="globe" label={t.s4_people} data={imp.people} unit={u(imp.people.unit_ar, imp.people.unit_en)} assume={t.assume_people} lang={lang} accent="var(--accent-2)" delay={120} />
          <ImpactCard icon="beaker" label={t.s4_dollars} data={imp.dollars} unit={u(imp.dollars.unit_ar, imp.dollars.unit_en)} assume={t.assume_dollars} lang={lang} accent="var(--healthy)" delay={240} />
        </div>

        {/* comparison */}
        <div className="hud-panel animate-rise" style={{ animationDelay: ".36s", marginTop: "var(--s6)", padding: 0 }}>
          <header style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="grid" size={17} style={{ color: "var(--accent)" }} />
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16 }}>{t.s4_compare}</span>
            </div>
          </header>
          <div style={{ padding: 22 }}>
            <CompareBar active={true} lang={lang} />
            <div style={{ marginTop: 18, padding: "12px 14px", background: "var(--accent-soft)", border: "1px solid var(--accent-line)", borderRadius: "var(--r-md)", fontSize: 13, color: "var(--text)", lineHeight: 1.55, display: "flex", gap: 9 }}>
              <Icon name="pulse" size={16} style={{ color: "var(--accent)", flex: "none", marginTop: 2 }} />
              <span>{t.s4_compare_note}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 11.5, color: "var(--text-3)" }}>
          potential recoverable under stated assumptions · {t.assumptionsLine}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenImpact });
