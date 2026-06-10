"use client";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { fmtM3 } from "@/lib/format";
import Counter from "./Counter";
import Skeleton from "./Skeleton";

export default function KpiStrip() {
  const { t, lang } = useI18n();
  const [imp, setImp] = useState<any>(null);
  const [val, setVal] = useState<any>(null);
  const [crit, setCrit] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [i, v, f] = await Promise.all([
        api.impact(),
        api.validation(),
        api.forecast("azraq"),
      ]);
      setImp(i.data);
      setVal(v.data);
      setCrit(f.data.forecast?.critical_month ?? null);
    })();
  }, []);

  const cards: {
    label: string;
    icon: string;
    node: ReactNode;
    tone: string;
    hero?: boolean;
  }[] = [
    {
      label: t("kpi_red"),
      icon: "▲",
      tone: "text-red",
      node: imp ? <Counter value={imp.red_fields} format={(n) => String(Math.round(n))} /> : null,
    },
    {
      label: t("kpi_m3"),
      icon: "◇",
      tone: "grad-text",
      hero: true,
      node: imp ? <Counter value={imp.recoverable_m3yr} format={(n) => fmtM3(n, lang)} /> : null,
    },
    {
      label: t("kpi_val"),
      icon: "◎",
      tone: "text-mint",
      node: val ? (
        <span className="stat">
          {val.sites_covered}
          <span className="text-faint">/{val.sites_total}</span>
        </span>
      ) : null,
    },
    {
      label: t("kpi_crit"),
      icon: "◷",
      tone: "text-amber",
      node: crit ? <span className="stat ltr inline-block">{crit}</span> : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="panel panel-hover px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-bg2 text-xs text-muted">
              {c.icon}
            </span>
            <span className="label">{c.label}</span>
          </div>
          <div className={`mt-2 ${c.hero ? "text-[2rem] leading-none" : "text-2xl"} ${c.tone}`}>
            {c.node ?? <Skeleton className="h-7 w-20" />}
          </div>
        </div>
      ))}
    </div>
  );
}
