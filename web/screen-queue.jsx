/* ============================================================
   MIZAN — Screen 3: Inspection queue + Evidence panel
   Controlled by app (demo path drives selection/evidence/status).
   ============================================================ */

function ScreenQueue({ lang, loading, selectedRank, evidenceOpen, statuses, onSelect, onEvidence, onStatusChange }) {
  const t = getT(lang);
  const rows0 = window.MIZAN_DATA.queue;
  const [sort, setSort] = useState({ key: "rank", dir: 1 });

  const rows = useMemo(() => {
    const r = [...rows0];
    const k = sort.key;
    r.sort((a, b) => {
      let va, vb;
      if (k === "m3") { va = a.m3_high; vb = b.m3_high; }
      else if (k === "gps") { va = a.lat; vb = b.lat; }
      else { va = a[k]; vb = b[k]; }
      return (va > vb ? 1 : va < vb ? -1 : 0) * sort.dir;
    });
    return r;
  }, [sort, rows0]);

  const doSort = key => setSort(s => ({ key, dir: s.key === key ? -s.dir : 1 }));
  const selectedRow = rows0.find(r => r.rank === selectedRank);
  const open = evidenceOpen && selectedRow;

  const cols = [
    { key: "rank", label: t.col_rank, sortable: true, w: 70 },
    { key: "gps", label: t.col_gps, sortable: true },
    { key: "area_ha", label: t.col_area, sortable: true },
    { key: "first_seen", label: t.col_first, sortable: true },
    { key: "m3", label: t.col_m3, sortable: true },
    { key: "score", label: t.col_grade, sortable: true, w: 110 },
    { key: "status", label: t.col_status, w: 130 },
    { key: "ev", label: t.col_evidence, w: 120 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: open ? "1fr 660px" : "1fr 0px", height: "100%" }}>
      {/* table side */}
      <div style={{ padding: "var(--s6)", overflow: "auto", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 6 }}>{t.navNum.queue} · {t.nav.queue}</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800 }}>{t.s3_title}</h1>
            <p style={{ margin: "6px 0 0", color: "var(--text-2)", fontSize: 13.5 }}>{t.s3_sub}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <DataBadge lang={lang} />
            <span className="badge badge-region"><Icon name="globe" size={13} />{t.regionalSignal}</span>
          </div>
        </div>

        {loading ? <QueueSkeleton /> : (
          <div className="hud-panel" style={{ padding: 0, overflow: "hidden" }}>
            <table className="tabular" style={{ fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "rgba(31,41,55,.6)" }}>
                  {cols.map(c => (
                    <th key={c.key} onClick={() => c.sortable && doSort(c.key)}
                      style={{ padding: "13px 14px", textAlign: "start", fontFamily: "var(--font-head)", fontSize: 11.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: sort.key === c.key ? "var(--accent)" : "var(--text-3)", cursor: c.sortable ? "pointer" : "default", whiteSpace: "nowrap", width: c.w, borderBottom: "1px solid var(--line-strong)", userSelect: "none" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        {c.label}
                        {c.sortable && <span style={{ opacity: sort.key === c.key ? 1 : .3, fontSize: 10 }}>{sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : "▲"}</span>}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const st = statuses[r.rank] || r.status;
                  const isSel = selectedRank === r.rank;
                  return (
                    <tr key={r.rank} onClick={() => onSelect(r.rank)}
                      style={{ cursor: "pointer", background: isSel ? "var(--accent-soft)" : "transparent", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", transition: "background .15s", boxShadow: isSel ? "inset 3px 0 0 var(--accent)" : "none" }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,.02)"; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                      <td style={td}><span className="num" style={{ fontFamily: "var(--font-num)", fontWeight: 800, fontSize: 16, color: r.rank <= 2 ? "var(--danger)" : "var(--text)" }}>{r.rank}</span></td>
                      <td style={td}><span className="num" style={{ fontFamily: "var(--font-num)" }}>{r.gps}</span></td>
                      <td style={td}><span className="num">{r.area_ha}</span> <span style={{ color: "var(--text-3)", fontSize: 12 }}>{t.ha}</span></td>
                      <td style={td}><span className="num">{r.first_seen}</span></td>
                      <td style={td}><span className="num" style={{ fontWeight: 700 }}>{r.m3_low}–{r.m3_high}</span> <span style={{ color: "var(--text-3)", fontSize: 12 }}>{lang === "ar" ? r.m3_unit_ar : r.m3_unit_en}</span></td>
                      <td style={td}><ScoreBadge score={r.score} grade={r.grade} lang={lang} /></td>
                      <td style={td}><StatusBadge status={st} lang={lang} /></td>
                      <td style={td}>
                        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onEvidence(r.rank); }}
                          style={{ background: isSel && evidenceOpen ? "var(--accent)" : "var(--surface-2)", color: isSel && evidenceOpen ? "#042f2a" : "var(--text)", borderColor: isSel && evidenceOpen ? "transparent" : "var(--line-strong)" }}>
                          <Icon name="layers" size={14} />{t.open_evidence}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="target" size={14} />{t.not_theft}
        </div>
      </div>

      {/* evidence drawer */}
      <div style={{ overflow: "hidden", minWidth: 0 }}>
        {open && (
          <div style={{ height: "100%" }}>
            <EvidencePanel row={selectedRow} lang={lang}
              status={statuses[selectedRow.rank] || selectedRow.status}
              onStatus={s => onStatusChange(selectedRow.rank, s)}
              onClose={() => onEvidence(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

const td = { padding: "14px 14px", whiteSpace: "nowrap", verticalAlign: "middle" };

function QueueSkeleton() {
  return (
    <div className="hud-panel" style={{ padding: 16 }}>
      <div className="skeleton" style={{ height: 22, width: "40%", marginBottom: 18 }} />
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
          {[40, 120, 70, 60, 90, 70, 90, 90].map((w, j) => <div key={j} className="skeleton" style={{ height: 18, width: w }} />)}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ScreenQueue });
