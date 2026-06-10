"use client";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Forecast } from "@/lib/types";

export default function GraceChart({ data }: { data: Forecast }) {
  const obs = data.tws.series.map((p) => ({
    month: p.month,
    obs: p.anomaly_cm,
  }));
  const fc = data.forecast.forecast.map((p) => ({
    month: p.month,
    yhat: p.yhat,
    band: [p.lo, p.hi] as [number, number],
  }));
  const merged = [...obs, ...fc];
  const crit = data.forecast.critical_month;
  const critPoint = fc.find((p) => p.month === crit);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={merged} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#243152" strokeDasharray="2 4" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#94a4c6", fontSize: 9 }}
          interval={29}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#94a4c6", fontSize: 9 }}
          tickLine={false}
          label={{ value: "cm", angle: -90, position: "insideLeft", fill: "#94a4c6", fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: "#16213b",
            border: "1px solid #243152",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#94a4c6" }}
        />
        <Area
          dataKey="band"
          stroke="none"
          fill="#22d3ee"
          fillOpacity={0.12}
          connectNulls
        />
        <Line
          dataKey="obs"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
          name="GRACE"
        />
        <Line
          dataKey="yhat"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          connectNulls
          name="forecast"
        />
        {critPoint && (
          <ReferenceDot
            x={critPoint.month}
            y={critPoint.yhat}
            r={6}
            fill="#ef4444"
            stroke="#0a0f1e"
            strokeWidth={2}
            isFront
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
