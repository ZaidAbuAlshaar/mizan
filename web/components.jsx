/* ============================================================
   MIZAN — Shared component library
   Exports to window for cross-file (Babel) sharing.
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

const NUM = window.MIZAN_NUM;
function getT(lang) { return window.MIZAN_I18N[lang]; }
function D(v, lang, data) { return NUM.digits(v, lang, data); } // numerals helper

/* ---------------- Icons ---------------- */
const ICONS = {
  search: "M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  flag: "M5 21V4M5 4l11 1-2 5 2 5-11-1",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  chevron: "M9 6l6 6-6 6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12l4.5 4.5L19 7",
  x: "M6 6l12 12M18 6L6 18",
  sliders: "M4 6h16M4 12h16M4 18h16M9 6v0M15 12v0M7 18v0",
  drop: "M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z",
  beaker: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3",
  scale: "M12 3v18M7 21h10M12 6l-7 2 3.5 6a3.5 3.5 0 01-7 0L5 8M12 6l7 2-3.5 6a3.5 3.5 0 007 0L19 8",
  pulse: "M3 12h4l2-6 4 14 2-8h6",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12v0",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5",
  alert: "M12 3l9 16H3zM12 10v4M12 18v0",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  history: "M3 12a9 9 0 109-9 9 9 0 00-7 3M3 3v4h4M12 8v4l3 2",
};
function Icon({ name, size = 18, stroke = 1.7, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ---------------- MIZAN logo (two pans + orbital arc) ---------------- */
function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mz-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      {/* orbital arc */}
      <ellipse cx="20" cy="20" rx="17" ry="8.5" stroke="url(#mz-g)" strokeWidth="1.4"
        opacity="0.55" transform="rotate(-24 20 20)" />
      {/* beam */}
      <path d="M20 7v22" stroke="url(#mz-g)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="6.5" r="2.1" fill="url(#mz-g)" />
      <path d="M9 30h22" stroke="url(#mz-g)" strokeWidth="2.2" strokeLinecap="round" />
      {/* beam arms */}
      <path d="M11 12h18" stroke="url(#mz-g)" strokeWidth="1.6" strokeLinecap="round" />
      {/* pans */}
      <path d="M6 13l5 0 5 0-2.5 5a3 3 0 01-5 0z" fill="url(#mz-g)" opacity="0.9" />
      <path d="M24 13l5 0 5 0-2.5 5a3 3 0 01-5 0z" fill="url(#mz-g)" opacity="0.9" />
      <path d="M11 12l-2.5 1M11 12l2.5 1" stroke="url(#mz-g)" strokeWidth="1.2" />
      <path d="M29 12l-2.5 1M29 12l2.5 1" stroke="url(#mz-g)" strokeWidth="1.2" />
    </svg>
  );
}

/* ---------------- Badges ---------------- */
function DemoBadge({ lang, small }) {
  const t = getT(lang);
  return (
    <span className="badge badge-demo" style={small ? { fontSize: 10, padding: "3px 7px" } : null} title="demo data">
      <svg className="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 8v5M12 16v.5M5 20h14a1.6 1.6 0 001.4-2.5L13.4 5a1.6 1.6 0 00-2.8 0L3.6 17.5A1.6 1.6 0 005 20z" />
      </svg>
      {t.demoData}
    </span>
  );
}
function RegionBadge({ lang }) {
  const t = getT(lang);
  return (
    <span className="badge badge-region" title="regional signal ~300km">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v4M12 12h3" />
      </svg>
      {t.regionalSignal}
    </span>
  );
}

/* grade → token */
const GRADE = {
  critical: { color: "var(--danger)", soft: "var(--danger-soft)", emoji: "🔴" },
  stressed: { color: "var(--warning)", soft: "var(--warning-soft)", emoji: "🟠" },
  healthy:  { color: "var(--healthy)", soft: "var(--healthy-soft)", emoji: "🟢" },
};
function GradeDot({ grade, size = 9 }) {
  const g = GRADE[grade] || GRADE.healthy;
  return <span className="dot" style={{ width: size, height: size, borderRadius: "50%", background: g.color, display: "inline-block", boxShadow: `0 0 8px ${g.color}` }} />;
}
function ScoreBadge({ score, grade, lang }) {
  const g = GRADE[grade] || GRADE.healthy;
  return (
    <span className="badge" style={{ color: g.color, background: g.soft, borderColor: g.color + "55" }}>
      <GradeDot grade={grade} />
      <span className="num" style={{ fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 13 }}>{D(score, lang, true)}</span>
    </span>
  );
}

/* status badge — fixed token colors + permanent text */
const STATUS = {
  new:        { color: "var(--accent-2)", soft: "rgba(34,211,238,.14)", key: "st_new" },
  inspecting: { color: "var(--warning)",  soft: "var(--warning-soft)",  key: "st_inspecting" },
  confirmed:  { color: "var(--danger)",   soft: "var(--danger-soft)",   key: "st_confirmed" },
  cleared:    { color: "var(--healthy)",  soft: "var(--healthy-soft)",  key: "st_cleared" },
};
function StatusBadge({ status, lang }) {
  const s = STATUS[status] || STATUS.new;
  const t = getT(lang);
  return (
    <span className="badge" style={{ color: s.color, background: s.soft, borderColor: s.color + "44" }}>
      <span className="dot" style={{ background: s.color }} />
      {t[s.key]}
    </span>
  );
}

/* ---------------- Panel ---------------- */
function Panel({ title, eyebrow, icon, actions, children, ticked, className = "", style, pad = true, badge }) {
  return (
    <section className={`hud-panel ${ticked ? "ticked" : ""} ${className}`} style={style}>
      {(title || eyebrow || actions || badge) && (
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "14px 16px", borderBottom: "1px solid var(--line)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            {icon && <span style={{ color: "var(--accent)", display: "flex", flex: "none" }}><Icon name={icon} size={17} /></span>}
            <div style={{ minWidth: 0 }}>
              {eyebrow && <div className="eyebrow" style={{ marginBottom: 3 }}>{eyebrow}</div>}
              {title && <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15, color: "var(--text)", lineHeight: 1.2 }}>{title}</div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
            {badge}
            {actions}
          </div>
        </header>
      )}
      <div style={{ padding: pad ? "var(--pad-panel)" : 0 }}>{children}</div>
    </section>
  );
}

/* ---------------- Range number ---------------- */
function RangeNumber({ low, high, unit, lang, size = 46, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
      <span className="stat-big" style={{ fontSize: size, color: accent || "var(--text)" }}>
        {D(low, lang, true)}
        <span style={{ color: "var(--text-3)", fontWeight: 700, margin: "0 6px" }}>–</span>
        {D(high, lang, true)}
      </span>
      {unit && <span style={{ color: "var(--text-2)", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-head)" }}>{unit}</span>}
    </div>
  );
}

/* ---------------- Sidebar stat tile ---------------- */
function StatTile({ icon, label, sub, value, valueNode, accent, demo, lang, big }) {
  return (
    <div className="hud-panel" style={{ padding: "14px 15px", background: "rgba(17,24,39,.6)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-2)" }}>
          {icon && <span style={{ color: accent || "var(--accent)", display: "flex" }}><Icon name={icon} size={15} /></span>}
          <span className="eyebrow" style={{ color: "var(--text-2)" }}>{label}</span>
        </div>
        {demo && <DataBadge lang={lang} small />}
      </div>
      {valueNode || (
        <div className="stat-big" style={{ fontSize: big ? 38 : 30, color: accent || "var(--text)" }}>{value}</div>
      )}
      {sub && <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

/* ---------------- Segmented toggle ---------------- */
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: "var(--r-pill)", padding: 3, gap: 2 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} className="num"
          style={{
            border: "none", cursor: "pointer", borderRadius: "var(--r-pill)",
            padding: "6px 14px", fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12.5,
            background: value === o.value ? "var(--accent)" : "transparent",
            color: value === o.value ? "#042f2a" : "var(--text-2)",
            transition: "all .15s ease",
          }}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------------- Layer toggle chip ---------------- */
function LayerChip({ active, onClick, color, children }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "9px 11px", borderRadius: "var(--r-md)", cursor: "pointer",
      background: active ? "rgba(255,255,255,.04)" : "transparent",
      border: `1px solid ${active ? "var(--line-strong)" : "var(--line)"}`,
      color: active ? "var(--text)" : "var(--text-3)", transition: "all .15s ease",
      fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, textAlign: "start",
    }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color, flex: "none", opacity: active ? 1 : .4, boxShadow: active ? `0 0 8px ${color}` : "none" }} />
      <span style={{ flex: 1 }}>{children}</span>
      <span style={{ width: 28, height: 16, borderRadius: 999, background: active ? "var(--accent)" : "var(--surface-3)", position: "relative", flex: "none", transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 2, insetInlineStart: active ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "inset-inline-start .15s" }} />
      </span>
    </button>
  );
}

Object.assign(window, {
  useState, useEffect, useRef, useMemo,
  getT, D, Icon, ICONS, Logo,
  DemoBadge, RegionBadge, GradeDot, ScoreBadge, StatusBadge, GRADE, STATUS,
  Panel, RangeNumber, StatTile, Segmented, LayerChip,
});
