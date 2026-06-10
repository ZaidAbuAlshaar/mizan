"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { fmtInt, levelColor, levelDot } from "@/lib/format";
import { levelOf } from "@/lib/types";
import type { FeatureCollection, Meta } from "@/lib/types";
import DemoBadge from "@/components/DemoBadge";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[72vh] place-items-center rounded-xl border border-line bg-panel text-muted">
      …
    </div>
  ),
});

export default function NationalMap() {
  const { t, lang } = useI18n();
  const [fields, setFields] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [basins, setBasins] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [meta, setMeta] = useState<Meta | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    (async () => {
      const [f, b, m] = await Promise.all([
        api.fields(),
        api.basins(),
        api.meta(),
      ]);
      setFields(f.data);
      setBasins(b.data);
      setMeta(m.data);
      setOffline(f.offline || b.offline);
    })();
  }, []);

  const agg = useMemo(() => {
    const by: Record<string, { red: number; m3: number }> = {};
    for (const f of fields.features) {
      const b = String(f.properties.basin);
      by[b] ??= { red: 0, m3: 0 };
      if (f.properties.score >= 70) {
        by[b].red++;
        by[b].m3 += f.properties.est_m3yr;
      }
    }
    return by;
  }, [fields]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-head text-2xl font-extrabold">{t("nav_map")}</h1>
          <p className="text-muted text-sm">{t("tagline")}</p>
        </div>
        <DemoBadge demo={meta?.demo} offline={offline} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MapView fields={fields} basins={basins} height="72vh" />
        </div>

        <aside className="space-y-3">
          <div className="panel p-3">
            <div className="text-muted mb-2 text-[11px]">{t("basins")}</div>
            <div className="space-y-2">
              {basins.features.map((b) => {
                const p = b.properties as any;
                const lv = levelOf(p.stress_pct >= 150 ? 99 : p.stress_pct >= 100 ? 50 : 10);
                const a = agg[p.id] || { red: 0, m3: 0 };
                return (
                  <Link
                    key={p.id}
                    href={`/basin/${p.id}`}
                    className="block rounded-lg border border-line bg-panel2 p-3 transition-colors hover:border-accent"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-head font-bold">
                        {lang === "ar" ? p.name_ar : p.name_en}
                      </span>
                      <span
                        className="stat text-sm"
                        style={{ color: levelColor[lv] }}
                      >
                        {levelDot[lv]} {p.stress_pct}%
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-muted">
                      <span>
                        {t("red_flags")}: <b className="text-ink">{a.red}</b>
                      </span>
                      <span>
                        {t("est_m3")}:{" "}
                        <b className="text-accent">{fmtInt(a.m3, lang)}</b>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="panel p-3 text-xs text-muted">
            <span className="me-1">🔴🟠🟢</span>
            {lang === "ar"
              ? "كل نقطة = حقل مشبوه، لونها حسب درجة الاشتباه (0–100). اضغط نقطة لفتح دليلها."
              : "Each dot = a suspected field colored by suspicion score (0–100). Click a dot to open its evidence."}
          </div>
        </aside>
      </div>
    </div>
  );
}
