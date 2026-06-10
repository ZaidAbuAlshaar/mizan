/* ============================================================
   MIZAN — Screen 5: Methodology & limits (calm, readable)
   ============================================================ */

const TIER = {
  A: { color: "var(--healthy)", key: "tierA" },
  B: { color: "var(--accent-2)", key: "tierB" },
  C: { color: "var(--demo)", key: "tierC" },
};

function ScreenMethod({ lang }) {
  const t = getT(lang);
  const D2 = window.MIZAN_DATA;

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--s8)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 6 }}>{t.navNum.method} · {t.nav.method}</div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800 }}>{t.s5_title}</h1>
          <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 14 }}>{t.s5_sub}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "var(--s5)", alignItems: "start" }}>
          {/* datasets */}
          <Panel title={t.s5_datasets} icon="grid" eyebrow={`${D2.datasets.length} ${lang === "ar" ? "مصدراً" : "datasets"}`} pad={false} ticked>
            <div>
              {D2.datasets.map((d, i) => {
                const tr = TIER[d.tier];
                return (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderTop: i ? "1px solid var(--line)" : "none" }}>
                    <span style={{ fontFamily: "var(--font-num)", fontSize: 11, color: "var(--text-3)", width: 22, flex: "none" }}>{String(i + 1).padStart(2, "0")}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13.5 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 1 }}>{lang === "ar" ? d.role_ar : d.role_en}</div>
                    </div>
                    <span className="badge" style={{ color: tr.color, background: tr.color + "1f", borderColor: tr.color + "55", flex: "none" }}>
                      <span className="dot" style={{ background: tr.color }} />{t[tr.key]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
            {/* model card */}
            <Panel title={t.s5_modelcard} icon="doc" ticked>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <McRow k={t.mc_input} v={t.mc_input_v} color="var(--accent)" />
                <McRow k={t.mc_output} v={t.mc_output_v} color="var(--accent-2)" />
                <McRow k={t.mc_human} v={t.mc_human_v} color="var(--healthy)" />
                <McRow k={t.mc_notfor} v={t.mc_notfor_v} color="var(--danger)" warn />
              </div>
            </Panel>

            {/* references */}
            <Panel title={t.s5_refs} icon="doc" eyebrow={`${D2.refs.length} ${lang === "ar" ? "مرجعاً" : "refs"}`}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {D2.refs.map((r, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3, paddingBottom: 10, borderBottom: i < D2.refs.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <span className="eyebrow" style={{ color: "var(--accent)" }}>{lang === "ar" ? r.tag_ar : r.tag_en}</span>
                    <span style={{ fontSize: 12.5, color: "var(--text-2)", direction: "ltr", textAlign: lang === "ar" ? "right" : "left", fontFamily: "var(--font-num)" }}>{r.cite}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* five limits */}
        <div style={{ marginTop: "var(--s6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Icon name="alert" size={18} style={{ color: "var(--warning)" }} />
            <h2 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800 }}>{t.s5_limits}</h2>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{lang === "ar" ? "— الصراحة سلاح" : "— candour is a weapon"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--s4)" }}>
            {D2.limits.map((l, i) => (
              <div key={i} className="hud-panel" style={{ padding: "16px 18px", display: "flex", gap: 13 }}>
                <span style={{ fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 24, color: "var(--warning)", opacity: .85, flex: "none", lineHeight: 1 }}>{String(i + 1).padStart(2, "0")}</span>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{lang === "ar" ? l.ar : l.en}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function McRow({ k, v, color, warn }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span className="badge" style={{ color, background: color + "1f", borderColor: color + "55", flex: "none", minWidth: 72, justifyContent: "center" }}>{warn && <Icon name="alert" size={12} />}{k}</span>
      <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, paddingTop: 4 }}>{v}</span>
    </div>
  );
}

Object.assign(window, { ScreenMethod });
