import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getSite,
  getSiteEnergy,
  startSession,
  stopSession,
  type ChargerStatus,
  type EnergyPoint,
  type SiteDetail as SiteDetailData,
} from "../api";
import EnergyChart from "../components/EnergyChart";

const STATUSES: ("all" | ChargerStatus)[] = [
  "all",
  "available",
  "charging",
  "faulted",
  "offline",
];

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const siteId = Number(id);

  const [data, setData] = useState<SiteDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ChargerStatus>(
    "all",
  );
  const [from, setFrom] = useState(todayISO(-7));
  const [to, setTo] = useState(todayISO());
  const [energy, setEnergy] = useState<EnergyPoint[]>([]);

  const latestRequestId = useRef(0);

  const reload = () => {
    const requestId = ++latestRequestId.current;
    getSite(siteId)
      .then((d) => {
        console.log(
          "[reload]",
          requestId,
          latestRequestId.current,
          JSON.stringify(d.chargers.map((c) => [c.id, c.status])),
        );
        if (requestId === latestRequestId.current) setData(d);
      })
      .catch((e) => {
        if (requestId === latestRequestId.current) setError(e.message);
      });
  };

  useEffect(reload, [siteId]);

  useEffect(() => {
    getSiteEnergy(siteId, from, to)
      .then(setEnergy)
      .catch((e) => setError(e.message));
  }, [siteId, from, to]);

  const filteredChargers = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.chargers;
    return data.chargers.filter((c) => c.status === statusFilter);
  }, [data, statusFilter]);

  if (error) return <p data-testid="error">Failed to load site: {error}</p>;
  if (!data) return <p data-testid="loading">Loading site…</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">{data.site.name}</h1>
      <p className="text-gray-500 mb-6">
        {data.site.city} · {data.today_energy_kwh.toFixed(1)} kWh today
      </p>

      <section className="mb-6">
        <div className="flex gap-2 mb-3 items-end">
          <label className="text-sm">
            From{" "}
            <input
              type="date"
              value={from}
              data-testid="date-from"
              onChange={(e) => setFrom(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="text-sm">
            To{" "}
            <input
              type="date"
              value={to}
              data-testid="date-to"
              onChange={(e) => setTo(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </label>
        </div>
        <EnergyChart data={energy} />
      </section>

      <section>
        <div className="flex gap-2 mb-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              data-testid={`filter-${s}`}
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-3 py-1 rounded border ${
                statusFilter === s ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <table className="w-full text-sm" data-testid="chargers-table">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Connector</th>
              <th>Power (kW)</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredChargers.map((c) => (
              <tr key={c.id} className="border-t" data-testid="charger-row">
                <td className="py-2">{c.connector_type}</td>
                <td>{c.power_kw}</td>
                <td data-testid="charger-status">{c.status}</td>
                <td>
                  {c.status === "charging" ? (
                    <button
                      data-testid="stop-session"
                      className="text-red-600 underline"
                      onClick={() => stopSession(c.id).then(reload)}
                    >
                      Stop
                    </button>
                  ) : c.status === "available" ? (
                    <button
                      data-testid="start-session"
                      className="text-green-600 underline"
                      onClick={() => startSession(c.id).then(reload)}
                    >
                      Start
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
