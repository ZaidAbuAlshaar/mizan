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
            <stop offset="0%" stopColor="#00FFB2" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#00FFB2" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#232834" strokeDasharray="2 4" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#A3AAB8", fontSize: 9 }}
          interval={5}
          tickLine={false}
        />
        <YAxis domain={[0, 0.8]} tick={{ fill: "#A3AAB8", fontSize: 9 }} tickLine={false} />
        <ReferenceLine y={0.35} stroke="#FFB547" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{
            background: "#171A21",
            border: "1px solid #232834",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#A3AAB8" }}
        />
        <Area
          type="monotone"
          dataKey="ndvi"
          stroke="#00FFB2"
          strokeWidth={2}
          fill="url(#ndvi)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
