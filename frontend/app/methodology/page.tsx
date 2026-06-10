"use client";
import { useI18n } from "@/lib/i18n";

const REPO = "https://github.com/kurdim12/mizan";

export default function Methodology() {
  const { t, lang } = useI18n();
  const ar = lang === "ar";

  const datasets = [
    ["Sentinel-2 (L2A/L1C)", ar ? "كاشف الحقول NDVI" : "field detector (NDVI)"],
    ["Landsat 5/7/8/9", ar ? "السجل التاريخي" : "historical record"],
    ["HLS", ar ? "سلسلة موحّدة (بمراجع التحدي)" : "harmonized series (in challenge refs)"],
    ["MODIS MOD13Q1 / MOD16A2GF", ar ? "اتجاه + ET" : "trend + ET"],
    ["SMAP L4", ar ? "رطوبة (بمراجع التحدي)" : "soil moisture (in challenge refs)"],
    ["CHIRPS", ar ? "شاهد النفي المطري" : "rainfall negative-witness"],
    ["JRC Global Surface Water", ar ? "استبعاد الريّ السطحي" : "surface-water exclusion"],
    ["GRACE-FO mascon", ar ? "وزن المياه (قيمة مضافة)" : "weighing water (added value)"],
  ];
  const limits = [
    [ar ? "GRACE خشن ~300كم" : "GRACE coarse ~300km", ar ? "ماكرو فقط؛ التحديد من Sentinel-2" : "macro only; fields from Sentinel-2"],
    [ar ? "إيجابيات كاذبة" : "false positives", ar ? "درجة ثقة + استبعاد مياه معالَجة + human-in-the-loop" : "confidence + treated-water exclusion + human-in-the-loop"],
    [ar ? "سجلّ التراخيص" : "licensing registry", ar ? "غير متاح → استراتيجية الطبقات الثلاث" : "unavailable → three-tier strategy"],
    [ar ? "فجوة GRACE 2017–2018" : "GRACE 2017–2018 gap", ar ? "تُعرض بشفافية" : "shown transparently"],
    [ar ? "الحساسية السياسية" : "political sensitivity", ar ? "أداة دعم قرار لا وشاية؛ لا تُعرّف أفراداً" : "decision support, not surveillance; no individuals identified"],
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-head text-2xl font-extrabold">{t("nav_method")}</h1>

      <div className="panel p-4">
        <div className="font-head mb-2 font-bold">
          {ar ? "البيانات الفضائية المستخدمة" : "Space data used"}
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {datasets.map(([d, role]) => (
            <div key={d} className="flex justify-between rounded-lg border border-line bg-panel2 px-3 py-1.5 text-sm">
              <span className="font-head">{d}</span>
              <span className="text-muted">{role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <div className="font-head mb-2 font-bold">
          {ar ? "الطريقة (P1→P7)" : "Method (P1→P7)"}
        </div>
        <p className="text-sm text-muted leading-7">
          {ar
            ? "P1 مركّبات NDVI شهرية · P2 قناع ريّ بالقواعد (NDVI≥0.35 ∧ مطر<10مم ∧ غطاء ∧ خارج المياه السطحية/المعالَجة) · P3 كشف التغيّر + سنة الظهور · P4 درجة اشتباه شفافة 0–100 · P5 تقدير م³ (مساحة×6,000–9,000) · P6 تنبّؤ GRACE+Prophet والتاريخ الحرج · P7 التحقّق بمواقع إنفاذ حقيقية."
            : "P1 monthly NDVI composites · P2 rule-based irrigation mask (NDVI≥0.35 ∧ rain<10mm ∧ cover ∧ not surface/treated water) · P3 change detection + first-seen year · P4 transparent 0–100 suspicion score · P5 m³ estimate (area×6,000–9,000) · P6 GRACE+Prophet forecast & critical date · P7 validation against real enforcement sites."}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="font-head mb-2 font-bold">{ar ? "الحدود (بصراحة)" : "Limits (honestly)"}</div>
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
          <ul className="space-y-1 text-sm text-muted leading-7">
            <li>• {ar ? "النوع: قواعد (أرضية) + Random Forest (تحسين)" : "Type: rule-based baseline + Random Forest"}</li>
            <li>• {ar ? "المخرجات: مرشّحات تفتيش مرتّبة، لا أحكام قانونية" : "Output: ranked inspection candidates, not legal verdicts"}</li>
            <li>• {ar ? "الإنسان في الحلقة: المفتّش يقرر" : "Human-in-the-loop: the inspector decides"}</li>
            <li>• {ar ? "الأوزان شفافة ومجموعها 100" : "Weights are transparent and sum to 100"}</li>
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
