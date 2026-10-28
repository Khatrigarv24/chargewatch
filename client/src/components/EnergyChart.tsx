import {
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
} from "recharts";
import type { EnergyPoint } from "../api";

const ACCENT = "#3ba7ff";
const GRID = "rgba(231, 236, 240, 0.09)";
const AXIS = "#8b96a3";

function formatHour(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
}

export default function EnergyChart({ data }: { data: EnergyPoint[] }) {
  return (
    <div
      data-testid="energy-chart"
      className="h-64 rounded border border-line bg-surface p-3"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="hour"
            tickFormatter={formatHour}
            tick={{ fontSize: 11, fill: AXIS, fontFamily: "Geist Mono" }}
            axisLine={{ stroke: GRID }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: AXIS, fontFamily: "Geist Mono" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)} kWh`, "energy"]}
            labelFormatter={formatHour}
            contentStyle={{
              background: "#12161b",
              border: "1px solid rgba(231, 236, 240, 0.09)",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "Geist Mono",
            }}
            labelStyle={{ color: "#8b96a3" }}
            itemStyle={{ color: "#e7ecf0" }}
          />
          <Area
            type="monotone"
            dataKey="energy_kwh"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#energyFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
