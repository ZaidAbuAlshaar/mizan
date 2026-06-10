"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { FieldProps, Status } from "@/lib/types";
import FieldTable from "@/components/FieldTable";
import EvidencePanel from "@/components/EvidencePanel";
import DemoBadge from "@/components/DemoBadge";

export default function Queue() {
  const { t, lang } = useI18n();
  const [fields, setFields] = useState<FieldProps[]>([]);
  const [sel, setSel] = useState<FieldProps | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [demo, setDemo] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await api.fields();
      setFields(r.data.features.map((f) => f.properties as FieldProps));
      setOffline(r.offline);
      setDemo(Boolean(r.data.properties?.demo));
    })();
  }, []);

  const shown = useMemo(
    () => fields.filter((f) => f.score >= minScore),
    [fields, minScore]
  );

  function onStatus(id: string, s: Status) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: s } : f))
    );
    setSel((prev) => (prev && prev.id === id ? { ...prev, status: s } : prev));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-head text-2xl font-extrabold">{t("nav_queue")}</h1>
          <p className="text-muted text-sm">
            {lang === "ar"
              ? "مرتّب حسب درجة الاشتباه — ابدأ من الأعلى."
              : "Ranked by suspicion score — start from the top."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-muted text-xs">
            {t("score")} ≥ <b className="stat text-ink">{minScore}</b>
          </label>
          <input
            type="range"
            min={0}
            max={90}
            step={10}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="accent-accent"
          />
          <DemoBadge demo={demo} offline={offline} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <FieldTable fields={shown} onSelect={setSel} selectedId={sel?.id} />
        </div>
        <div className="lg:col-span-2">
          {sel ? (
            <EvidencePanel
              field={sel}
              onClose={() => setSel(null)}
              onStatus={onStatus}
            />
          ) : (
            <div className="panel grid h-full min-h-[300px] place-items-center p-6 text-center text-muted">
              {lang === "ar"
                ? "اختر صفاً لفتح بانل الدليل"
                : "Select a row to open the evidence panel"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
