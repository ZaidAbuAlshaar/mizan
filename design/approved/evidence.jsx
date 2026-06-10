/* ============================================================
   MIZAN — Before / After slider (uses <image-slot>)
   ============================================================ */
function BeforeAfter({ lang, beforeId = "ev-before", afterId = "ev-after" }) {
  const t = getT(lang);
  const [pos, setPos] = useState(50);
  const wrap = useRef(null);
  const drag = useRef(false);

  const move = clientX => {
    const r = wrap.current.getBoundingClientRect();
    let p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(2, Math.min(98, p)));
  };
  useEffect(() => {
    const mm = e => drag.current && move(e.touches ? e.touches[0].clientX : e.clientX);
    const mu = () => (drag.current = false);
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", mm); window.addEventListener("touchend", mu);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); window.removeEventListener("touchmove", mm); window.removeEventListener("touchend", mu); };
  }, []);

  return (
    <div ref={wrap} style={{ position: "relative", width: "100%", aspectRatio: "16/10", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)", userSelect: "none", direction: "ltr" }}>
      {/* after (full) */}
      <image-slot id={afterId} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        shape="rect" fit="cover" placeholder={t.ev_drop_after}></image-slot>
      {/* before (clipped) */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <image-slot id={beforeId} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          shape="rect" fit="cover" placeholder={t.ev_drop_before}></image-slot>
      </div>
      {/* labels */}
      <span style={lblStyle("left")}>{t.ev_before}</span>
      <span style={lblStyle("right")}>{t.ev_after}</span>
      {/* handle */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "var(--accent)", transform: "translateX(-1px)", boxShadow: "0 0 10px var(--accent)" }}>
        <div onMouseDown={() => (drag.current = true)} onTouchStart={() => (drag.current = true)}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize", color: "#042f2a", boxShadow: "0 2px 10px rgba(0,0,0,.5)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M9 7l-4 5 4 5M15 7l4 5-4 5" /></svg>
        </div>
      </div>
    </div>
  );
}
function lblStyle(side) {
  return { position: "absolute", bottom: 10, [side]: 10, fontFamily: "var(--font-num)", fontSize: 11.5, fontWeight: 700, color: "#fff", background: "rgba(7,16,31,.7)", padding: "4px 9px", borderRadius: 999, border: "1px solid var(--line-strong)", backdropFilter: "blur(4px)" };
}

/* ============================================================
   Evidence panel
   ============================================================ */
function EvidencePanel({ row, lang, status, onStatus, onClose }) {
  const t = getT(lang);
  const statusFlow = ["new", "inspecting", "confirmed", "cleared"];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--surface-1)", borderInlineStart: "1px solid var(--line-strong)", boxShadow: "var(--shadow-2)" }}>
      {/* header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 5 }}>{t.ev_title} · {t.ev_patch} #{D(row.rank, lang, true)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="num" style={{ fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 18 }}>{row.gps}</span>
            <ScoreBadge score={row.score} grade={row.grade} lang={lang} />
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent-line)" }}><Icon name="target" size={13} />{t.candidate_label}</span>
            <DemoBadge lang={lang} small />
          </div>
          <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--text-3)" }}>{t.not_theft}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 8 }}><Icon name="x" size={16} /></button>
      </div>

      {/* scroll body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* two elements above the fold */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}><Icon name="pulse" size={15} style={{ color: "var(--healthy)" }} />{t.ev_ndvi}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{t.ev_ndvi_sub}</div>
              </div>
              <DemoBadge lang={lang} small />
            </div>
            <div className="hud-panel" style={{ padding: 10 }}><NdviChart active={true} lang={lang} /></div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}><Icon name="layers" size={15} style={{ color: "var(--accent-2)" }} />{t.ev_beforeafter}</div>
              <DemoBadge lang={lang} small />
            </div>
            <BeforeAfter lang={lang} />
          </div>
        </div>

        {/* score breakdown */}
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{t.ev_score}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {row.score_parts.map((p, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: "var(--text-2)" }}>{lang === "ar" ? p.k_ar : p.k_en}</span>
                  <span className="num" style={{ fontFamily: "var(--font-num)", fontWeight: 700 }}>{D(p.v, lang, true)}<span style={{ color: "var(--text-3)" }}>/{D(p.max, lang, true)}</span></span>
                </div>
                <div style={{ height: 7, background: "var(--surface-1)", borderRadius: 4, overflow: "hidden", border: "1px solid var(--line)" }}>
                  <div style={{ height: "100%", width: `${(p.v / p.max) * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))", borderRadius: 4, transition: "width .8s ease" }} />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--line)" }}>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 700 }}>{lang === "ar" ? "الدرجة الكلّية" : "Total score"}</span>
              <ScoreBadge score={row.score} grade={row.grade} lang={lang} />
            </div>
          </div>
        </div>
      </div>

      {/* status updater (sticky footer) */}
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "rgba(17,24,39,.85)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}><Icon name="check" size={15} style={{ color: "var(--accent)" }} />{t.ev_updateStatus}</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{t.ev_human}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {statusFlow.map(s => {
            const sc = window.STATUS[s];
            const on = status === s;
            return (
              <button key={s} onClick={() => onStatus(s)} className="num"
                style={{ flex: 1, padding: "9px 6px", borderRadius: "var(--r-md)", cursor: "pointer", fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12,
                  border: `1px solid ${on ? sc.color : "var(--line)"}`, background: on ? sc.soft : "transparent", color: on ? sc.color : "var(--text-3)", transition: "all .15s" }}>
                {t[sc.key]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BeforeAfter, EvidencePanel });
