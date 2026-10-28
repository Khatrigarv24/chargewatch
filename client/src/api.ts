const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type ChargerStatus = "available" | "charging" | "faulted" | "offline";

export interface SiteSummary {
  id: number;
  name: string;
  city: string;
  capacity_kw: number;
  available: number;
  charging: number;
  faulted: number;
  offline: number;
}

export interface Charger {
  id: number;
  site_id: number;
  connector_type: string;
  power_kw: number;
  status: ChargerStatus;
}

export interface SiteDetail {
  site: { id: number; name: string; city: string; capacity_kw: number };
  chargers: Charger[];
  today_energy_kwh: number;
}

export interface EnergyPoint {
  hour: string;
  energy_kwh: number;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getSites(): Promise<SiteSummary[]> {
  return request("/api/sites");
}

export function getSite(id: number): Promise<SiteDetail> {
  return request(`/api/sites/${id}`);
}

export function getSiteEnergy(
  id: number,
  from: string,
  to: string,
): Promise<EnergyPoint[]> {
  return request(
    `/api/sites/${id}/energy?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
}

export function getChargers(status?: ChargerStatus): Promise<Charger[]> {
  return request(`/api/chargers${status ? `?status=${status}` : ""}`);
}

export async function startSession(chargerId: number): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/chargers/${chargerId}/sessions/start`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

export async function stopSession(chargerId: number): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/chargers/${chargerId}/sessions/stop`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}
