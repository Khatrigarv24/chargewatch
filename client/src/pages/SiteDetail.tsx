import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import StatusBadge from "../components/StatusBadge";
import { reveal } from "../motion";

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
  const tableRef = useRef<HTMLTableSectionElement>(null);

  const latestRequestId = useRef(0);

  const reload = () => {
    const requestId = ++latestRequestId.current;
    getSite(siteId)
      .then((d) => {
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

  useEffect(() => {
    if (!tableRef.current) return;
    reveal(tableRef.current.querySelectorAll("[data-testid=charger-row]"));
  }, [filteredChargers]);

  if (error)
    return (
      <p data-testid="error" className="p-6 text-status-faulted">
        Failed to load site: {error}
      </p>
    );
  if (!data)
    return (
      <p data-testid="loading" className="p-6 text-muted">
        Loading site…
      </p>
    );

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link
        to="/"
        className="draw mb-2 inline-block py-1.5 text-sm text-muted hover:text-ink"
      >
        ← Sites
      </Link>
      <h1 className="mb-1 text-2xl font-semibold text-ink">
        {data.site.name}
      </h1>
      <p className="mb-6 text-sm text-muted">
        {data.site.city} ·{" "}
        <span className="font-mono text-ink">
          {data.today_energy_kwh.toFixed(1)}
        </span>{" "}
        kWh today
      </p>

      <section className="mb-8">
        <div className="mb-3 flex items-end gap-4">
          <label className="text-sm text-muted">
            From{" "}
            <input
              type="date"
              value={from}
              data-testid="date-from"
              onChange={(e) => setFrom(e.target.value)}
              className="rounded border border-line bg-surface px-2 py-1 font-mono text-sm text-ink"
            />
          </label>
          <label className="text-sm text-muted">
            To{" "}
            <input
              type="date"
              value={to}
              data-testid="date-to"
              onChange={(e) => setTo(e.target.value)}
              className="rounded border border-line bg-surface px-2 py-1 font-mono text-sm text-ink"
            />
          </label>
        </div>
        <EnergyChart data={energy} />
      </section>

      <section>
        <div className="segmented mb-3" role="group" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              data-testid={`filter-${s}`}
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full text-sm" data-testid="chargers-table">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-3 py-2 font-normal">Connector</th>
                <th className="px-3 py-2 font-normal">Power (kW)</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal"></th>
              </tr>
            </thead>
            <tbody ref={tableRef}>
              {filteredChargers.map((c) => (
                <tr
                  key={c.id}
                  className="lift-on-hover border-t border-line"
                  data-testid="charger-row"
                >
                  <td className="px-3 py-2.5">{c.connector_type}</td>
                  <td className="px-3 py-2.5 font-mono">{c.power_kw}</td>
                  <td className="px-3 py-2.5" data-testid="charger-status">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {c.status === "charging" ? (
                      <button
                        data-testid="stop-session"
                        className="btn-flood rounded px-2 py-1 text-status-faulted"
                        onClick={() => stopSession(c.id).then(reload)}
                      >
                        Stop
                      </button>
                    ) : c.status === "available" ? (
                      <button
                        data-testid="start-session"
                        className="btn-flood rounded px-2 py-1 text-status-available"
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
        </div>
      </section>
    </div>
  );
}
