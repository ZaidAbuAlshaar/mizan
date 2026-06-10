"use client";
import { useI18n } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      className="btn"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      aria-label="toggle language"
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}
