/* ============================================================
   MIZAN — App shell: header, nav, demo path, language flip, tweaks
   ============================================================ */

const BASE_STATUS = { 1: "new", 2: "new", 3: "inspecting" };

const DEMO = [
  { screen: "map",    sel: null, ev: false, st: BASE_STATUS, cap_ar: "الخريطة الوطنية", cap_en: "National map" },
  { screen: "basin",  sel: null, ev: false, st: BASE_STATUS, cap_ar: "حوض أحمر — الأزرق", cap_en: "Red basin — Azraq" },
  { screen: "queue",  sel: null, ev: false, st: BASE_STATUS, cap_ar: "طابور التفتيش", cap_en: "Inspection queue" },
  { screen: "queue",  sel: 1, ev: false, st: BASE_STATUS, cap_ar: "أعلى تنبيه", cap_en: "Top alert" },
  { screen: "queue",  sel: 1, ev: true, st: BASE_STATUS, cap_ar: "بانل الدليل", cap_en: "Evidence panel" },
  { screen: "queue",  sel: 1, ev: true, st: { ...BASE_STATUS, 1: "inspecting" }, cap_ar: "تحديث الحالة", cap_en: "Update status" },
  { screen: "basin",  sel: 1, ev: true, st: { ...BASE_STATUS, 1: "inspecting" }, cap_ar: "منحنى + دفتر الميزان", cap_en: "Curve + ledger" },
  { screen: "impact", sel: 1, ev: true, st: { ...BASE_STATUS, 1: "inspecting" }, cap_ar: "عدّاد الأثر", cap_en: "Impact counter" },
];

const NAV = ["map", "queue", "impact", "basin", "method"];

const FONTS = {
  almarai: { head: "'Almarai', sans-serif", body: "'Tajawal', sans-serif", label: "Almarai · Tajawal" },
  cairo:   { head: "'Cairo', sans-serif", body: "'Cairo', sans-serif", label: "Cairo" },
  ibm:     { head: "'IBM Plex Sans Arabic', sans-serif", body: "'IBM Plex Sans Arabic', sans-serif", label: "IBM Plex Arabic" },
  kufi:    { head: "'Noto Kufi Arabic', sans-serif", body: "'Tajawal', sans-serif", label: "Noto Kufi" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#2DD4BF", "#22D3EE"],
  "font": "almarai",
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = useState("ar");
  const [screen, setScreen] = useState("map");
  const [demoStep, setDemoStep] = useState(0);
  const [sel, setSel] = useState(null);
  const [ev, setEv] = useState(false);
  const [statuses, setStatuses] = useState(BASE_STATUS);
  const [loading, setLoading] = useState(true);
  const t = getT(lang);

  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setLoading(false); } };
    (window.MIZAN_LOAD || Promise.resolve()).then(finish, finish);
    const id = setTimeout(finish, 4000);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => { document.documentElement.dir = t.dir; document.documentElement.lang = lang; }, [lang]);

  // demo stepper
  const applyStep = i => {
    const s = DEMO[i];
    setDemoStep(i); setScreen(s.screen); setSel(s.sel); setEv(s.ev); setStatuses(s.st);
  };
  const next = () => applyStep(Math.min(demoStep + 1, DEMO.length - 1));
  const prev = () => applyStep(Math.max(demoStep - 1, 0));

  // keyboard nav
  useEffect(() => {
    const h = e => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") (t.dir === "rtl" ? prev : next)();
      if (e.key === "ArrowLeft") (t.dir === "rtl" ? next : prev)();
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [demoStep, lang]);

  const goNav = (id) => { setScreen(id); };

  // tweak-derived css vars
  const pal = tw.accent || TWEAK_DEFAULTS.accent;
  const font = FONTS[tw.font] || FONTS.almarai;
  const dens = { compact: 0.86, regular: 1, comfy: 1.14 }[tw.density] ?? 1;
  const cssVars = {
    "--accent": pal[0], "--accent-2": pal[1],
    "--accent-soft": `color-mix(in srgb, ${pal[0]} 15%, transparent)`,
    "--accent-line": `color-mix(in srgb, ${pal[0]} 45%, transparent)`,
    "--font-head": font.head, "--font-body": font.body, "--font-num": font.head,
    "--density": dens,
  };

  const screens = {
    map: <ScreenMap lang={lang} onNav={goNav} loading={loading} />,
    queue: <ScreenQueue lang={lang} loading={loading} selectedRank={sel} evidenceOpen={ev} statuses={statuses}
      onSelect={r => setSel(r)} onEvidence={r => { if (r == null) { setEv(false); } else { setSel(r); setEv(true); } }}
      onStatusChange={(r, s) => setStatuses(p => ({ ...p, [r]: s }))} />,
    impact: <ScreenImpact lang={lang} onNav={goNav} />,
    basin: <ScreenBasin lang={lang} onNav={goNav} />,
    method: <ScreenMethod lang={lang} />,
  };

  return (
    <div dir={t.dir} style={{ ...cssVars, height: "100%", display: "flex", flexDirection: "column", fontFamily: "var(--font-body)" }}>
      {/* ===== Header ===== */}
      <header style={{ height: "var(--header-h)", flex: "none", display: "flex", alignItems: "center", gap: 18, padding: "0 20px", borderBottom: "1px solid var(--line)", background: "linear-gradient(180deg, rgba(17,24,39,.92), rgba(10,22,40,.92))", backdropFilter: "blur(8px)", position: "relative", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <Logo size={34} />
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 20, letterSpacing: lang === "ar" ? 0 : ".02em", lineHeight: 1 }}>
              {t.brand} <span style={{ color: "var(--text-3)", fontWeight: 400, fontSize: 12 }}>· {lang === "ar" ? "MIZAN" : "ميزان"}</span>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3 }}>{t.brandSub}</div>
          </div>
        </div>

        {/* search */}
        <div style={{ flex: 1, maxWidth: 420, margin: "0 auto", position: "relative" }}>
          <span style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", display: "flex" }}><Icon name="search" size={16} /></span>
          <input placeholder={t.search}
            style={{ width: "100%", height: 38, background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", color: "var(--text)", padding: "0 14px", paddingInlineStart: 36, fontSize: 13, fontFamily: "var(--font-body)", outline: "none" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-2)", fontFamily: "var(--font-head)", fontWeight: 700, letterSpacing: ".05em" }}>
            <span className="live-dot" />{t.live}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setLang(l => l === "ar" ? "en" : "ar")} style={{ fontFamily: "var(--font-head)", minWidth: 52 }}>
            <Icon name="globe" size={15} />{t.langLabel}
          </button>
        </div>
      </header>

      {/* ===== Nav strip ===== */}
      <nav style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "0 16px", height: 50, borderBottom: "1px solid var(--line)", background: "rgba(10,22,40,.6)", position: "relative", zIndex: 19, overflowX: "auto" }}>
        {NAV.map(id => {
          const on = screen === id;
          return (
            <button key={id} onClick={() => goNav(id)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", borderRadius: "var(--r-md)", border: "1px solid " + (on ? "var(--accent-line)" : "transparent"), background: on ? "var(--accent-soft)" : "transparent", color: on ? "var(--text)" : "var(--text-2)", cursor: "pointer", fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", transition: "all .15s" }}>
              <span className="num" style={{ fontFamily: "var(--font-num)", fontSize: 11, color: on ? "var(--accent)" : "var(--text-3)" }}>{t.navNum[id]}</span>
              {t.nav[id]}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {/* demo stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none", background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: "var(--r-pill)", padding: "4px 6px" }}>
          <span className="eyebrow" style={{ paddingInlineStart: 8, color: "var(--text-3)" }}>{t.demoPath}</span>
          <button className="btn btn-sm" onClick={prev} disabled={demoStep === 0} style={{ padding: 7, borderRadius: "50%" }} aria-label="prev">
            <span className="rtl-flip" style={{ display: "flex" }}><Icon name="chevron" size={15} style={{ transform: "scaleX(-1)" }} /></span>
          </button>
          <div style={{ textAlign: "center", minWidth: 116 }}>
            <div style={{ fontSize: 12.5, fontFamily: "var(--font-head)", fontWeight: 700, color: "var(--text)", lineHeight: 1.1 }}>{lang === "ar" ? DEMO[demoStep].cap_ar : DEMO[demoStep].cap_en}</div>
            <div className="num" style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-num)" }}>{D(demoStep + 1, lang, true)} / {D(DEMO.length, lang, true)}</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={next} disabled={demoStep === DEMO.length - 1} style={{ padding: 7, borderRadius: "50%" }} aria-label="next">
            <span className="rtl-flip" style={{ display: "flex" }}><Icon name="chevron" size={15} /></span>
          </button>
        </div>
      </nav>

      {/* ===== Stage ===== */}
      <main style={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
        <div key={screen + lang} className="screen-enter" style={{ position: "absolute", inset: 0 }}>
          {screens[screen]}
        </div>
      </main>

      {/* ===== Tweaks ===== */}
      <TweaksPanel title={lang === "ar" ? "تخصيص · Tweaks" : "Tweaks"}>
        <TweakSection label={lang === "ar" ? "اللون المميِّز" : "Accent"} />
        <TweakColor label={lang === "ar" ? "التركوازي / السماوي" : "Turquoise / Cyan"} value={tw.accent}
          options={[["#2DD4BF", "#22D3EE"], ["#22D3EE", "#38BDF8"], ["#34D399", "#2DD4BF"], ["#5EEAD4", "#67E8F9"]]}
          onChange={v => setTweak("accent", v)} />
        <TweakSection label={lang === "ar" ? "الخط" : "Typeface"} />
        <TweakSelect label={lang === "ar" ? "العائلة" : "Family"} value={tw.font}
          options={Object.keys(FONTS).map(k => ({ value: k, label: FONTS[k].label }))}
          onChange={v => setTweak("font", v)} />
        <TweakSection label={lang === "ar" ? "الكثافة" : "Density"} />
        <TweakRadio label={lang === "ar" ? "التباعد" : "Spacing"} value={tw.density}
          options={[{ value: "compact", label: lang === "ar" ? "مضغوط" : "Compact" }, { value: "regular", label: lang === "ar" ? "عادي" : "Regular" }, { value: "comfy", label: lang === "ar" ? "مريح" : "Comfy" }]}
          onChange={v => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
