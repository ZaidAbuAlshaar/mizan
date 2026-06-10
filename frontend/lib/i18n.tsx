"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ar" | "en";

const STRINGS = {
  brand: { ar: "ميزان", en: "MIZAN" },
  tagline: {
    ar: "نوزِن مياه الأردن المسروقة من الفضاء",
    en: "Weighing Jordan's stolen water from space",
  },
  footer_line: {
    ar: "كل قطرة محسوبة… من الفضاء — والوزن لا يكذب",
    en: "Every drop accounted for — from space",
  },
  nav_map: { ar: "الخريطة الوطنية", en: "National map" },
  nav_queue: { ar: "طابور التفتيش", en: "Inspection queue" },
  nav_basin: { ar: "تفاصيل الحوض", en: "Basin detail" },
  nav_impact: { ar: "عدّاد الأثر", en: "Impact" },
  nav_method: { ar: "المنهجية", en: "Methodology" },
  nav_alerts: { ar: "التنبيهات", en: "Alerts" },
  alerts_sub: { ar: "أحدث الأعلام الحمراء الجديدة — صندوق وارد المفتّش", en: "Freshest new red flags — the inspector's inbox" },
  no_alerts: { ar: "لا تنبيهات جديدة", en: "No new alerts" },
  back: { ar: "رجوع", en: "Back" },
  excluded_treated: { ar: "مُستبعَد: ريّ بمياه معالَجة (نهر الزرقاء/خربة السمرا)", en: "Excluded: treated-wastewater irrigation (Zarqa river / As-Samra)" },
  open_full: { ar: "صفحة الحقل الكاملة", en: "Full field page" },
  demo: { ar: "بيانات تجريبية", en: "demo data" },
  offline: { ar: "أوفلاين (بيانات مضمّنة)", en: "offline (bundled data)" },
  basins: { ar: "الأحواض", en: "Basins" },
  red_flags: { ar: "أعلام حمراء", en: "Red flags" },
  est_m3: { ar: "م³ مقدّرة/سنة", en: "Est. m³/yr" },
  rank: { ar: "الرتبة", en: "Rank" },
  id_gps: { ar: "المعرّف · GPS", en: "ID · GPS" },
  area: { ar: "المساحة (هكتار)", en: "Area (ha)" },
  first_seen: { ar: "أول ظهور", en: "First seen" },
  score: { ar: "الدرجة", en: "Score" },
  status: { ar: "الحالة", en: "Status" },
  evidence: { ar: "الدليل", en: "Evidence" },
  open_evidence: { ar: "افتح الدليل", en: "Open evidence" },
  st_new: { ar: "جديد", en: "new" },
  st_inspected: { ar: "مُعايَن", en: "inspected" },
  st_confirmed: { ar: "مؤكَّد", en: "confirmed" },
  st_cleared: { ar: "مُبرّأ", en: "cleared" },
  ndvi: { ar: "مؤشّر الغطاء النباتي NDVI", en: "NDVI" },
  components: { ar: "مكوّنات الدرجة (شفافة، مجموعها 100)", en: "Score components (transparent, sum to 100)" },
  update_status: { ar: "تحديث الحالة", en: "Update status" },
  before_after: { ar: "قبل / بعد (2016 ↔ 2026)", en: "Before / after (2016 ↔ 2026)" },
  copy_coords: { ar: "نسخ الإحداثيات", en: "Copy coordinates" },
  copied: { ar: "نُسخت ✓", en: "Copied ✓" },
  grace_curve: { ar: "منحنى GRACE (إقليمي)", en: "GRACE curve (regional)" },
  grace_gap: { ar: "فجوة GRACE → GRACE-FO ‏2017–2018 (تُعرض بشفافية)", en: "GRACE → GRACE-FO gap 2017–2018 (shown transparently)" },
  observed: { ar: "مُشاهَد", en: "observed" },
  forecast_label: { ar: "تنبّؤ", en: "forecast" },
  threshold: { ar: "العتبة", en: "threshold" },
  critical_date: { ar: "تاريخ العتبة الحرجة", en: "Critical-threshold date" },
  time_machine: { ar: "آلة الزمن", en: "Time machine" },
  fields_visible: { ar: "حقول ظاهرة حتى", en: "Fields visible up to" },
  recoverable: { ar: "م³ قابلة للاسترجاع/سنة", en: "Recoverable m³/yr" },
  people_equiv: { ar: "يكفي مياه شرب لـ", en: "Drinking water for" },
  people: { ar: "شخص/سنة", en: "people/yr" },
  value: { ar: "القيمة التقديرية", en: "Estimated value" },
  vs_carrier: { ar: "مقابل الناقل الوطني", en: "vs the National Carrier" },
  validation_title: {
    ar: "التحقّق بمواقع إنفاذ حقيقية",
    en: "Validation against real enforcement sites",
  },
  stress: { ar: "الإجهاد", en: "Stress" },
  suspected: { ar: "حقول مشبوهة", en: "Suspected fields" },
  legend: { ar: "درجة الاشتباه", en: "Suspicion score" },
  legend_red: { ar: "افحص أولاً ≥70", en: "inspect first ≥70" },
  legend_amber: { ar: "راقب 40–69", en: "monitor 40–69" },
  legend_green: { ar: "غالباً مشروع <40", en: "likely legit <40" },
  kpi_red: { ar: "أعلام حمراء", en: "Red flags" },
  kpi_m3: { ar: "م³ قابلة للاسترجاع", en: "Recoverable m³" },
  kpi_val: { ar: "مواقع إنفاذ مطابقة", en: "Enforcement sites matched" },
  kpi_crit: { ar: "العتبة الحرجة", en: "Critical threshold" },
  view_queue: { ar: "إلى طابور التفتيش", en: "Go to inspection queue" },
  loading: { ar: "جارٍ التحميل…", en: "Loading…" },
} as const;

export type StrKey = keyof typeof STRINGS;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: StrKey) => string;
  dir: "rtl" | "ltr";
}
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      localStorage.getItem("mizan-lang")) as Lang | null;
    if (saved) setLang(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      localStorage.setItem("mizan-lang", lang);
    }
  }, [lang]);
  const t = (k: StrKey) => STRINGS[k][lang];
  return (
    <I18nContext.Provider
      value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
