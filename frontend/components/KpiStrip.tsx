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
    node: ReactNode;
    tone: string;
  }[] = [
    {
      label: t("kpi_red"),
      tone: "text-red",
      node: imp ? (
        <Counter value={imp.red_fields} format={(n) => String(Math.round(n))} />
      ) : null,
    },
    {
      label: t("kpi_m3"),
      tone: "text-accent",
      node: imp ? (
        <Counter value={imp.recoverable_m3yr} format={(n) => fmtM3(n, lang)} />
      ) : null,
    },
    {
      label: t("kpi_val"),
      tone: "text-green",
      node: val ? (
        <span className="stat">
          {val.sites_covered}/{val.sites_total}
        </span>
      ) : null,
    },
    {
      label: t("kpi_crit"),
      tone: "text-amber",
      node: crit ? <span className="stat ltr inline-block">{crit}</span> : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="panel px-4 py-3">
          <div className="text-muted text-[11px]">{c.label}</div>
          <div className={`mt-0.5 text-2xl ${c.tone}`}>
            {c.node ?? <Skeleton className="h-7 w-16" />}
          </div>
        </div>
      ))}
    </div>
  );
}
