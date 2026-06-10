"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "ar" | "en";

const STRINGS = {
  brand: { ar: "ميزان", en: "MIZAN" },
  tagline: {
    ar: "نوزِن مياه الأردن المسروقة من الفضاء",
    en: "Weighing Jordan's stolen water from space",
  },
  nav_map: { ar: "الخريطة الوطنية", en: "National map" },
  nav_queue: { ar: "طابور التفتيش", en: "Inspection queue" },
  nav_basin: { ar: "تفاصيل الحوض", en: "Basin detail" },
  nav_impact: { ar: "عدّاد الأثر", en: "Impact" },
  nav_method: { ar: "المنهجية", en: "Methodology" },
  demo: { ar: "بيانات تجريبية", en: "demo data" },
  offline: { ar: "أوفلاين (بيانات مضمّنة)", en: "offline (bundled data)" },
  basins: { ar: "الأحواض", en: "Basins" },
  red_flags: { ar: "أعلام حمراء", en: "Red flags" },
  est_m3: { ar: "م³ مقدّرة/سنة", en: "Est. m³/yr" },
  rank: { ar: "الرتبة", en: "Rank" },
  id: { ar: "المعرّف", en: "ID" },
  area: { ar: "المساحة (هكتار)", en: "Area (ha)" },
  first_seen: { ar: "أول ظهور", en: "First seen" },
  score: { ar: "الدرجة", en: "Score" },
  status: { ar: "الحالة", en: "Status" },
  evidence: { ar: "الدليل", en: "Evidence" },
  st_new: { ar: "جديد", en: "new" },
  st_inspected: { ar: "مُعايَن", en: "inspected" },
  st_confirmed: { ar: "مؤكَّد", en: "confirmed" },
  st_cleared: { ar: "مُبرّأ", en: "cleared" },
  ndvi: { ar: "مؤشّر الغطاء النباتي NDVI", en: "NDVI" },
  components: { ar: "مكوّنات الدرجة", en: "Score components" },
  update_status: { ar: "تحديث الحالة", en: "Update status" },
  grace_curve: { ar: "منحنى GRACE (إقليمي)", en: "GRACE curve (regional)" },
  forecast: { ar: "التنبّؤ", en: "Forecast" },
  critical_date: { ar: "تاريخ العتبة الحرجة", en: "Critical-threshold date" },
  recoverable: { ar: "م³ قابلة للاسترجاع/سنة", en: "Recoverable m³/yr" },
  people_equiv: { ar: "يكفي مياه شرب لـ", en: "Drinking water for" },
  people: { ar: "شخص/سنة", en: "people/yr" },
  value: { ar: "القيمة التقديرية", en: "Estimated value" },
  vs_carrier: {
    ar: "من إنتاج الناقل الوطني (300 م.م³، 6 مليار $)",
    en: "of the National Carrier (300 MCM, $6B)",
  },
  validation_title: {
    ar: "التحقّق بمواقع إنفاذ حقيقية",
    en: "Validation against real enforcement sites",
  },
  stress: { ar: "الإجهاد", en: "Stress" },
  suspected: { ar: "حقول مشبوهة", en: "Suspected fields" },
  open_basin: { ar: "افتح الحوض", en: "Open basin" },
} as const;

type Key = keyof typeof STRINGS;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
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
  const t = (k: Key) => STRINGS[k][lang];
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
