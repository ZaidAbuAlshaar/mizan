"use client";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t, lang } = useI18n();
  return (
    <footer className="mx-auto max-w-[1400px] px-4 py-6 text-center text-[11px] text-muted">
      <div>⚖ {t("footer_line")}</div>
      <div className="mt-1 opacity-75">
        {lang === "ar"
          ? "AstroCode 2026 · التحدي ٦ · فريق Vcoders — أداة دعم قرار، الإنسان في الحلقة"
          : "AstroCode 2026 · Challenge 6 · Team Vcoders — decision support, human-in-the-loop"}
      </div>
    </footer>
  );
}
