"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { fmtInt, fmtM3 } from "@/lib/format";
import type { Impact, Validation } from "@/lib/types";
import Counter from "@/components/Counter";
import DemoBadge from "@/components/DemoBadge";

export default function ImpactPage() {
  const { t, lang } = useI18n();
  const [imp, setImp] = useState<Impact | null>(null);
  const [val, setVal] = useState<Validation | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      const [i, v] = await Promise.all([api.impact(), api.validation()]);
      setImp(i.data);
      setVal(v.data);
      setOffline(i.offline || v.offline);
    })();
  }, []);

  const jodMid = imp ? Math.round((imp.jod_low + imp.jod_high) / 2) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-head text-2xl font-extrabold">{t("nav_impact")}</h1>
        <DemoBadge demo={imp?.demo} offline={offline} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-5 text-center">
          <div className="text-muted text-xs">💧 {t("recoverable")}</div>
          <div className="mt-2 text-5xl text-accent">
            {imp && <Counter value={imp.recoverable_m3yr} format={(n) => fmtM3(n, lang)} />}
          </div>
          <div className="text-muted mt-1 text-[11px]">
            {imp && `${fmtInt(imp.recoverable_m3yr, lang)} م³ · ${imp.red_fields} 🔴`}
          </div>
        </div>
        <div className="panel p-5 text-center">
          <div className="text-muted text-xs">👥 {t("people_equiv")}</div>
          <div className="mt-2 text-5xl">
            {imp && <Counter value={imp.people_equivalent} format={(n) => fmtInt(n, lang)} />}
          </div>
          <div className="text-muted mt-1 text-[11px]">{t("people")}</div>
        </div>
        <div className="panel p-5 text-center">
          <div className="text-muted text-xs">🪙 {t("value")}</div>
          <div className="mt-2 text-5xl text-green">
            {imp && <Counter value={jodMid} format={(n) => fmtInt(n, lang)} />}
          </div>
          <div className="text-muted mt-1 text-[11px]">
            {lang === "ar" ? "دينار/سنة (تقديري)" : "JOD/yr (est.)"}
          </div>
        </div>
      </div>

      {imp && (
        <div className="panel p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-head font-bold">
              {lang === "ar" ? "مقابل الناقل الوطني" : "vs the National Carrier"}
            </span>
            <span className="stat text-accent">{imp.carrier_share_pct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-panel2">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.min(imp.carrier_share_pct, 100)}%` }}
            />
          </div>
          <p className="text-muted mt-2 text-[11px]">
            {lang === "ar" ? imp.methodology_ar : imp.methodology_en}
          </p>
          <p className="text-muted mt-1 text-[11px]">
            {lang === "ar"
              ? "للسياق الوطني: الضخّ الجائر ~205 مليون م³ ≈ 68% من إنتاج الناقل (300 م.م³، 6 مليار $)."
              : "National context: ~205 MCM over-pumping ≈ 68% of the Carrier's output (300 MCM, $6B)."}
          </p>
        </div>
      )}

      {val && (
        <div className="panel p-4">
          <div className="font-head mb-1 font-bold">{t("validation_title")}</div>
          <p className="text-accent">
            {lang === "ar" ? val.statement_ar : val.statement_en}
          </p>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {val.rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-line bg-panel2 px-3 py-1.5 text-sm"
              >
                <span>{lang === "ar" ? r.name_ar : r.name_en}</span>
                <span className={r.covered ? "text-green" : "text-muted"}>
                  {r.covered
                    ? `✓ ${r.nearest_red_km} كم`
                    : lang === "ar"
                    ? "خارج النطاق"
                    : "outside"}
                </span>
              </div>
            ))}
          </div>
          {val.precision_at_20 === null && (
            <p className="text-muted mt-2 text-[11px]">
              {lang === "ar"
                ? "precision@20 يُحسب بعد إدخال نتائج التفتيش الميداني (لا رقم مُختلَق)."
                : "precision@20 is computed once field-inspection results are entered (no fabricated number)."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
