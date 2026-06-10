"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { fmtInt } from "@/lib/format";
import ScoreBadge from "@/components/ScoreBadge";
import Skeleton from "@/components/Skeleton";
import type { Alert } from "@/lib/types";

export default function AlertsPage() {
  const { t, lang } = useI18n();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.alerts().then((r) => {
      setAlerts(r.data.alerts || []);
      setReady(true);
    });
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-head text-2xl font-extrabold">🔔 {t("nav_alerts")}</h1>
          <p className="text-muted text-sm">{t("alerts_sub")}</p>
        </div>
        {ready && (
          <span className="chip border-red/60 text-red">
            {alerts.length} 🔴
          </span>
        )}
      </div>

      {!ready && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {ready && alerts.length === 0 && (
        <div className="panel p-8 text-center text-muted">{t("no_alerts")}</div>
      )}

      <div className="space-y-2">
        {alerts.map((a) => (
          <Link
            key={a.id}
            href={`/queue?sel=${encodeURIComponent(a.id)}`}
            className="panel flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:border-accent"
          >
            <span className="stat grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-panel2 text-muted">
              {a.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-head font-bold">{a.id}</span>
                <ScoreBadge score={a.score} />
                <span className="chip text-muted">{a.basin}</span>
              </div>
              <div className="ltr stat mt-0.5 text-[11px] text-muted">
                {a.lat?.toFixed?.(4)}, {a.lon?.toFixed?.(4)} · {a.area_ha} ha ·{" "}
                {a.first_seen_year}
              </div>
            </div>
            <div className="text-end">
              <div className="stat text-accent">{fmtInt(a.est_m3yr, lang)}</div>
              <div className="text-[10px] text-muted">{t("est_m3")}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
