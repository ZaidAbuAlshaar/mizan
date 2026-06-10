"use client";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n } from "@/lib/i18n";
import type { Forecast } from "@/lib/types";

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Pulsing red dot at the critical-threshold month (wow moment #6). */
function PulseDot({ cx, cy }: any) {
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="#FF5A5A" opacity={0.5} className="gc-pulse" />
      <circle cx={cx} cy={cy} r={5} fill="#FF5A5A" stroke="#050505" strokeWidth={2} />
    </g>
  );
}

export default function GraceChart({ data }: { data: Forecast }) {
  const { t } = useI18n();

  // continuous month axis with nulls inside the GRACE→GRACE-FO gap so the
  // observed line visibly BREAKS (transparency rule)
  const obsMap = new Map(data.tws.series.map((p) => [p.month, p.anomaly_cm]));
  const months: string[] = [];
  const first = data.tws.series[0]?.month;
  const last = data.tws.series.at(-1)?.month;
  if (first && last) {
    for (let m = first; m <= last; m = nextMonth(m)) months.push(m);
  }
  const obs = months.map((m) => ({ month: m, obs: obsMap.get(m) ?? null }));
  const fc = data.forecast.forecast.map((p) => ({
    month: p.month,
    yhat: p.yhat,
    band: [p.lo, p.hi] as [number, number],
  }));
  const merged = [...obs, ...fc];
  const crit = data.forecast.critical_month;
  const critPoint = fc.find((p) => p.month === crit);
  const thr = data.forecast.threshold_cm;

  return (
    <div className="ltr">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={merged} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
          <CartesianGrid stroke="#232834" strokeDasharray="2 4" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#A3AAB8", fontSize: 9 }}
            interval={29}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#A3AAB8", fontSize: 9 }}
            tickLine={false}
            label={{
              value: "cm",
              angle: -90,
              position: "insideLeft",
              fill: "#A3AAB8",
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#171A21",
              border: "1px solid #232834",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#A3AAB8" }}
          />
          {thr != null && (
            <ReferenceLine
              y={thr}
              stroke="#FF5A5A"
              strokeDasharray="6 4"
              strokeOpacity={0.6}
              label={{
                value: `${t("threshold")} ${thr}cm`,
                fill: "#FF5A5A",
                fontSize: 10,
                position: "insideBottomLeft",
              }}
            />
          )}
          <Area dataKey="band" stroke="none" fill="#00D9FF" fillOpacity={0.12} connectNulls />
          <Line
            dataKey="obs"
            stroke="#00D9FF"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name={t("observed")}
          />
          <Line
            dataKey="yhat"
            stroke="#FFB547"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
            name={t("forecast_label")}
          />
          {critPoint && (
            <ReferenceDot
              x={critPoint.month}
              y={critPoint.yhat}
              shape={<PulseDot />}
              isFront
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap items-center gap-3 px-1 text-[11px] text-muted">
        <span>
          <i className="mb-0.5 me-1 inline-block h-0.5 w-4 bg-accent2 align-middle" />
          {t("observed")} (GRACE/GRACE-FO)
        </span>
        <span>
          <i className="mb-0.5 me-1 inline-block h-0.5 w-4 border-t-2 border-dashed border-amber align-middle" />
          {t("forecast_label")}
        </span>
        <span className="text-red">● {t("critical_date")}</span>
        {data.tws.gap && <span>· {t("grace_gap")}</span>}
      </div>
    </div>
  );
}
