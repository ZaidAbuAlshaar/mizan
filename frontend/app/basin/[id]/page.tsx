"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { levelColor, levelDot } from "@/lib/format";
import { levelOf } from "@/lib/types";
import type { FeatureCollection, Forecast } from "@/lib/types";
import GraceChart from "@/components/GraceChart";
import DemoBadge from "@/components/DemoBadge";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function BasinPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const { t, lang } = useI18n();
  const [fc, setFc] = useState<Forecast | null>(null);
  const [basin, setBasin] = useState<any>(null);
  const [all, setAll] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [focus, setFocus] = useState<FeatureCollection | null>(null);
  const [offline, setOffline] = useState(false);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    (async () => {
      const [f, b, fl] = await Promise.all([
        api.forecast(id),
        api.basins(),
        api.fields(),
      ]);
      setFc(f.data);
      setOffline(f.offline);
      setAll(fl.data);
      const bf = b.data.features.find((x) => (x.properties as any).id === id);
      if (bf) {
        setBasin(bf.properties);
        setFocus({ type: "FeatureCollection", features: [bf] });
      }
    })();
  }, [id]);

  const basinFields = useMemo<FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: all.features.filter((f) => f.properties.basin === id),
    }),
    [all, id]
  );

  const lv = basin
    ? levelOf(basin.stress_pct >= 150 ? 99 : basin.stress_pct >= 100 ? 50 : 10)
    : "amber";
  const crit = fc?.forecast.critical_month;
  const phrase =
    lang === "ar"
      ? fc?.tws.region_phrase_ar || fc?.forecast.region_phrase_ar
      : fc?.tws.region_phrase_en || fc?.forecast.region_phrase_en;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-head text-2xl font-extrabold">
            {basin ? (lang === "ar" ? basin.name_ar : basin.name_en) : id}
          </h1>
          {basin && (
            <span
              className="stat rounded-md px-2 py-0.5"
              style={{ color: levelColor[lv], background: `${levelColor[lv]}1a` }}
            >
              {levelDot[lv]} {t("stress")} {basin.stress_pct}%
            </span>
          )}
        </div>
        <DemoBadge demo={fc?.demo} offline={offline} />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="panel p-3 lg:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-head font-bold">{t("grace_curve")}</span>
            {crit && (
              <span className="chip border-red/60 text-red">
                {t("critical_date")}: <b className="stat ms-1">{crit}</b>
              </span>
            )}
          </div>
          {fc ? (
            <GraceChart data={fc} />
          ) : (
            <div className="grid h-[260px] place-items-center text-muted">…</div>
          )}
          <p className="text-muted mt-2 text-[11px]">⚖ {phrase}</p>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <MapView fields={basinFields} basins={focus || undefined} focus={focus} height="300px" />
          <div className="panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-head text-sm font-bold">
                {lang === "ar" ? "آلة الزمن" : "Time machine"}
              </span>
              <span className="stat text-accent">{year}</span>
            </div>
            <input
              type="range"
              min={2016}
              max={2026}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-muted mt-1 text-[11px]">
              {lang === "ar"
                ? "تنزلق بين 2016 و2026 على مركّبات NDVI (تُحمَّل من GEE؛ عرض تجريبي الآن)."
                : "Slide 2016↔2026 over NDVI composites (loaded from GEE; demo stub now)."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
