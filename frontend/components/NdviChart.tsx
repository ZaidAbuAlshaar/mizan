"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function NdviChart({
  series,
}: {
  series: { month: string; ndvi: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={series} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="ndvi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#243152" strokeDasharray="2 4" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#94a4c6", fontSize: 9 }}
          interval={5}
          tickLine={false}
        />
        <YAxis domain={[0, 0.8]} tick={{ fill: "#94a4c6", fontSize: 9 }} tickLine={false} />
        <ReferenceLine y={0.35} stroke="#f59e0b" strokeDasharray="3 3" />
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
          type="monotone"
          dataKey="ndvi"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#ndvi)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
