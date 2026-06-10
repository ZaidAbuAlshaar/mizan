"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Feature, FieldProps, Status } from "@/lib/types";
import FieldTable from "@/components/FieldTable";
import EvidencePanel from "@/components/EvidencePanel";
import Skeleton from "@/components/Skeleton";

function centroid(geom: any): [number, number] {
  if (geom.type === "Point") return geom.coordinates;
  const ring = geom.coordinates[0];
  let x = 0,
    y = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
  }
  return [x / ring.length, y / ring.length];
}

function toRow(f: Feature): FieldProps {
  const [lon, lat] = centroid(f.geometry);
  return { ...(f.properties as FieldProps), lon, lat };
}

function QueueInner() {
  const { t, lang } = useI18n();
  const params = useSearchParams();
  const presel = params.get("sel");
  const [fields, setFields] = useState<FieldProps[]>([]);
  const [sel, setSel] = useState<FieldProps | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await api.fields();
      const rows = r.data.features.map(toRow);
      setFields(rows);
      setReady(true);
      if (presel) {
        const hit = rows.find((x) => x.id === presel);
        if (hit) setSel(hit);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presel]);

  const shown = useMemo(
    () => fields.filter((f) => f.score >= minScore),
    [fields, minScore]
  );

  function onStatus(id: string, s: Status) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, status: s } : f)));
    setSel((prev) => (prev && prev.id === id ? { ...prev, status: s } : prev));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-head text-2xl font-extrabold">{t("nav_queue")}</h1>
          <p className="text-muted text-sm">
            {lang === "ar"
              ? "مرتّب حسب درجة الاشتباه — سير المفتّش يبدأ من الأعلى."
              : "Ranked by suspicion score — the inspector starts at the top."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-muted text-xs">
            {t("score")} ≥ <b className="stat text-ink">{minScore}</b>
          </label>
          <div className="ltr">
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-36"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {ready ? (
            <FieldTable fields={shown} onSelect={setSel} selectedId={sel?.id} />
          ) : (
            <Skeleton className="h-[60vh]" />
          )}
        </div>
        <div className="lg:col-span-2">
          {sel ? (
            <EvidencePanel field={sel} onClose={() => setSel(null)} onStatus={onStatus} />
          ) : (
            <div className="panel grid h-full min-h-[320px] place-items-center p-6 text-center text-muted">
              <div>
                <div className="mb-2 text-3xl">🔍</div>
                {lang === "ar"
                  ? "اختر صفاً (أو زر «الدليل») لفتح بانل الدليل: NDVI، قبل/بعد، مكوّنات الدرجة، وتحديث الحالة"
                  : "Pick a row (or its Evidence button) to open the panel: NDVI, before/after, score breakdown, status update"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Queue() {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh]" />}>
      <QueueInner />
    </Suspense>
  );
}
