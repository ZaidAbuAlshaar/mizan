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
            <stop offset="0%" stopColor="#34D399" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#232A45" strokeDasharray="2 4" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#A5ADCB", fontSize: 9 }}
          interval={5}
          tickLine={false}
        />
        <YAxis domain={[0, 0.8]} tick={{ fill: "#A5ADCB", fontSize: 9 }} tickLine={false} />
        <ReferenceLine y={0.35} stroke="#FBBF24" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{
            background: "#12152A",
            border: "1px solid #232A45",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#A5ADCB" }}
        />
        <Area
          type="monotone"
          dataKey="ndvi"
          stroke="#34D399"
          strokeWidth={2}
          fill="url(#ndvi)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
