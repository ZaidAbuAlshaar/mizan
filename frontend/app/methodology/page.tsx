"use client";
import { useI18n } from "@/lib/i18n";

const REPO = "https://github.com/kurdim12/mizan";

const PIPELINE: { code: string; ar: string; en: string }[] = [
  { code: "P1", ar: "مركّبات NDVI شهرية", en: "Monthly NDVI composites" },
  { code: "P2", ar: "قناع الريّ بالقواعد", en: "Rule-based irrigation mask" },
  { code: "P3", ar: "كشف التغيّر + أول ظهور", en: "Change detection + first seen" },
  { code: "P4", ar: "درجة اشتباه شفافة 0–100", en: "Transparent 0–100 score" },
  { code: "P5", ar: "تقدير م³/سنة", en: "m³/yr estimate" },
  { code: "P6", ar: "تنبّؤ GRACE والتاريخ الحرج", en: "GRACE forecast & critical date" },
  { code: "P7", ar: "التحقّق بمواقع الإنفاذ", en: "Enforcement-site validation" },
];

const DATASETS: [string, string, { ar: string; en: string }][] = [
  ["Sentinel-2 L2A/L1C", "COPERNICUS/S2_SR_HARMONIZED · S2_HARMONIZED", { ar: "كاشف الحقول (NDVI)", en: "field detector (NDVI)" }],
  ["Landsat 8/9", "LANDSAT/LC08·LC09/C02/T1_L2", { ar: "السجل التاريخي", en: "historical record" }],
  ["HLS v2 ⭐", "NASA/HLS/HLSL30·HLSS30/v002", { ar: "بمراجع التحدي ٦", en: "named in Challenge 6 refs" }],
  ["MODIS NDVI/ET", "MODIS/061/MOD13Q1 · MOD16A2GF", { ar: "اتجاه طويل + ET", en: "long trend + ET" }],
  ["SMAP L4 ⭐", "NASA/SMAP/SPL4SMGP/008", { ar: "بعلي/مروي — بمراجع التحدي", en: "rainfed vs irrigated — in refs" }],
  ["CHIRPS", "UCSB-CHG/CHIRPS/DAILY", { ar: "شاهد النفي المطري", en: "rainfall negative-witness" }],
  ["JRC Water", "JRC/GSW1_4/GlobalSurfaceWater", { ar: "استبعاد الريّ السطحي", en: "surface-water exclusion" }],
  ["GRACE-FO mascon", "NASA/GRACE/MASS_GRIDS_V04/MASCON", { ar: "وزن المياه — قيمة مضافة فريدة", en: "weighing water — unique added value" }],
  ["GLDAS-2.2 GRACE-DA", "NASA/GLDAS/V022/CLSM/G025/DA1D", { ar: "خريطة جوفية مستوعِبة للجاذبية", en: "gravity-assimilated groundwater map" }],
];

export default function Methodology() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  const limits = [
    [ar ? "GRACE خشن ~300كم" : "GRACE is coarse (~300 km)", ar ? "ماكرو فقط؛ تحديد الحقول من Sentinel-2 حصراً" : "macro only; fields located by Sentinel-2 exclusively"],
    [ar ? "إيجابيات كاذبة" : "False positives", ar ? "درجة ثقة + استبعاد المياه المعالَجة (نهر الزرقاء/خربة السمرا) + human-in-the-loop" : "confidence score + treated-wastewater exclusion + human-in-the-loop"],
    [ar ? "سجلّ التراخيص غير متاح" : "Licensing registry unavailable", ar ? "استراتيجية الطبقات الثلاث؛ أي طبقة تجريبية موسومة" : "three-tier strategy; any mock layer is labeled"],
    [ar ? "فجوة GRACE 2017–2018" : "GRACE 2017–2018 gap", ar ? "تُعرض بشفافية في المنحنى (الخط ينقطع)" : "shown transparently (the line breaks)"],
    [ar ? "الحساسية" : "Sensitivity", ar ? "أداة دعم قرار للوزارة، لا \"وشاية\"؛ لا تُعرّف أفراداً" : "ministry decision support, not surveillance; no individuals identified"],
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-head text-2xl font-extrabold">{t("nav_method")}</h1>
        <p className="text-muted text-sm">
          {ar
            ? "الصراحة سلاح: المصادر والطريقة والحدود — كلها هنا."
            : "Honesty is a weapon: sources, method, and limits — all here."}
        </p>
      </div>

      {/* P1→P7 stepper */}
      <div className="panel p-4">
        <div className="font-head mb-3 font-bold">
          {ar ? "خط المعالجة P1→P7" : "Pipeline P1→P7"}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {PIPELINE.map((p, i) => (
            <span key={p.code} className="flex items-center gap-1.5">
              <span className="rounded-lg border border-line bg-panel2 px-2.5 py-1.5 text-xs">
                <b className="text-accent">{p.code}</b>{" "}
                <span className="text-muted">{ar ? p.ar : p.en}</span>
              </span>
              {i < PIPELINE.length - 1 && (
                <span className="text-muted">{ar ? "←" : "→"}</span>
              )}
            </span>
          ))}
        </div>
        <p className="text-muted mt-3 text-xs leading-6">
          {ar
            ? "P2 (القاعدة): NDVI صيفي ≥0.35 ∧ أمطار CHIRPS <10مم ∧ غطاء {زراعة/جرداء} ∧ خارج المياه السطحية/المعالَجة. الأوزان الستة للدرجة شفافة ومجموعها 100 — يفهمها الحَكَم والمفتّش."
            : "P2 (the rule): summer NDVI ≥0.35 ∧ CHIRPS rain <10mm ∧ {cropland/bare} cover ∧ outside surface/treated water. The six score weights are transparent and sum to 100 — judges and inspectors can read them."}
        </p>
      </div>

      <div className="panel p-4">
        <div className="font-head mb-2 font-bold">
          {ar ? "البيانات الفضائية — بالاسم والمعرّف" : "Space data — by name and asset ID"}
        </div>
        <div className="grid gap-1.5 lg:grid-cols-2">
          {DATASETS.map(([name, gee, role]) => (
            <div
              key={name}
              className="rounded-lg border border-line bg-panel2 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-head">{name}</span>
                <span className="text-muted text-xs">{ar ? role.ar : role.en}</span>
              </div>
              <code className="ltr mt-0.5 block truncate text-[10px] text-accent/80">
                {gee}
              </code>
            </div>
          ))}
        </div>
        <p className="text-muted mt-2 text-[11px]">
          {ar
            ? "⭐ = داتاست مذكور نصاً في مراجع التحدي ٦. كل المعرّفات مُتحقَّق منها — docs/VERIFICATION.md §3."
            : "⭐ = dataset named in Challenge 6 references. All IDs verified — docs/VERIFICATION.md §3."}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="font-head mb-2 font-bold">
            {ar ? "الحدود (بصراحة)" : "Limits (honestly)"}
          </div>
          <div className="space-y-1.5">
            {limits.map(([c, h]) => (
              <div key={c} className="rounded-lg border border-line bg-panel2 px-3 py-2 text-sm">
                <div className="text-amber">{c}</div>
                <div className="text-muted text-xs">{h}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <div className="font-head mb-2 font-bold">Model card</div>
          <ul className="space-y-1 text-sm leading-7 text-muted">
            <li>• {ar ? "النوع: قواعد (أرضية مضمونة) + Random Forest (ترقية اختيارية)" : "Type: rule-based baseline + optional Random Forest upgrade"}</li>
            <li>• {ar ? "المخرجات: مرشّحات تفتيش مرتّبة — لا أحكام قانونية" : "Output: ranked inspection candidates — not legal verdicts"}</li>
            <li>• {ar ? "الإنسان في الحلقة: المفتّش يقرر، النظام يوجّه عينه" : "Human-in-the-loop: the inspector decides, the system aims their eyes"}</li>
            <li>• {ar ? "precision@20 يبقى فارغاً حتى تتوفر نتائج ميدانية — لا رقم مُختلَق" : "precision@20 stays empty until field results exist — no fabricated number"}</li>
          </ul>
          <p className="mt-3 text-xs text-muted">
            {ar ? "المصادر والتحقّق الكامل:" : "Full sources & verification:"}{" "}
            <a className="text-accent underline" href={`${REPO}/blob/main/docs/VERIFICATION.md`} target="_blank" rel="noreferrer">
              docs/VERIFICATION.md
            </a>{" "}
            ·{" "}
            <a className="text-accent underline" href={REPO} target="_blank" rel="noreferrer">
              {REPO.replace("https://", "")}
            </a>
          </p>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted">
        {ar
          ? "تنويه: محتوى هذا المشروع طُوِّر بمساعدة الذكاء الاصطناعي (Claude) — مُفصَح عنه بفخر."
          : "Disclosure: this project was developed with AI assistance (Claude) — disclosed with pride."}
      </p>
    </div>
  );
}
