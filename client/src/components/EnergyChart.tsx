import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EnergyPoint } from "../api";

export default function EnergyChart({ data }: { data: EnergyPoint[] }) {
  return (
    <div data-testid="energy-chart" className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="energy_kwh"
            stroke="#2563eb"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
