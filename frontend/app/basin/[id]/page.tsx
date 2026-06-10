"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { fmtInt, levelColor, levelDot, stressLevel } from "@/lib/format";
import type { FeatureCollection, Forecast } from "@/lib/types";
import GraceChart from "@/components/GraceChart";
import Skeleton from "@/components/Skeleton";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full" />,
});

export default function BasinPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const { t, lang } = useI18n();
  const [fc, setFc] = useState<Forecast | null>(null);
  const [basin, setBasin] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [all, setAll] = useState<FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [focus, setFocus] = useState<FeatureCollection | null>(null);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    (async () => {
      const [f, b, fl, h] = await Promise.all([
        api.forecast(id),
        api.basins(),
        api.fields(),
        api.basinHealth(id),
      ]);
      setFc(f.data);
      setAll(fl.data);
      setHealth(h.data);
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

  const visibleCount = useMemo(
    () =>
      basinFields.features.filter((f) => f.properties.first_seen_year <= year)
        .length,
    [basinFields, year]
  );

  const redM3 = useMemo(
    () =>
      basinFields.features
        .filter((f) => f.properties.score >= 70)
        .reduce((s, f) => s + f.properties.est_m3yr, 0),
    [basinFields]
  );

  const lv = basin ? stressLevel(basin.stress_pct) : "amber";
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
              title={basin.stress_source}
            >
              {levelDot[lv]} {t("stress")} {basin.stress_pct}%
            </span>
          )}
        </div>
        {crit && (
          <span className="chip border-red/60 text-red">
            ⏱ {t("critical_date")}: <b className="stat ltr ms-1 inline-block">{crit}</b>
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t("suspected"), val: health?.suspected_fields, tone: "" },
          {
            label: t("red_flags"),
            val: basinFields.features.filter((f) => f.properties.score >= 70).length,
            tone: "text-red",
          },
          { label: t("est_m3"), val: redM3 ? fmtInt(redM3, lang) : null, tone: "text-accent" },
        ].map((c) => (
          <div key={c.label} className="panel px-4 py-3">
            <div className="text-muted text-[11px]">{c.label}</div>
            <div className={`stat mt-0.5 text-2xl ${c.tone}`}>
              {c.val ?? <Skeleton className="h-7 w-12" />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className="panel p-3 lg:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-head font-bold">{t("grace_curve")}</span>
            <span className="chip text-muted">
              NASA/GRACE MASCON + GLDAS-2.2 GRACE-DA
            </span>
          </div>
          {fc ? <GraceChart data={fc} /> : <Skeleton className="h-[280px]" />}
          <p className="text-muted mt-2 text-[11px]">⚖ {phrase}</p>
        </div>

        <div className="space-y-3 lg:col-span-2">
          <MapView
            fields={basinFields}
            basins={focus || undefined}
            focus={focus}
            yearFilter={year}
            legend={false}
            height="300px"
          />
          <div className="panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-head text-sm font-bold">
                🛰 {t("time_machine")}
              </span>
              <span className="stat text-xl text-accent">{year}</span>
            </div>
            <div className="ltr">
              <input
                type="range"
                min={2016}
                max={2026}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-0.5 flex justify-between text-[10px] text-muted">
                <span>2016</span>
                <span>2026</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              {t("fields_visible")} <b className="stat text-ink">{year}</b>:{" "}
              <b className="stat text-accent">{visibleCount}</b> /{" "}
              {basinFields.features.length}
              {lang === "ar"
                ? " — الصحراء «تخضرّ» أمامك: كل نقطة تظهر بسنة أول رصد لها."
                : " — watch the desert green up: each dot appears at its first-detection year."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
