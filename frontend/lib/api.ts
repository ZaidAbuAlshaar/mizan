// API layer with offline fallback. Tries the live backend; on any failure,
// loads the bundled labeled demo JSON from /public/demo (venue Plan B).
import type {
  Alert,
  FeatureCollection,
  Forecast,
  Impact,
  Meta,
  Validation,
  BasinHealth,
  Status,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Result<T> {
  data: T;
  offline: boolean;
}

async function get<T>(path: string, fallback: string): Promise<Result<T>> {
  try {
    const r = await fetch(`${BASE}${path}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`${r.status}`);
    return { data: (await r.json()) as T, offline: false };
  } catch {
    const r = await fetch(fallback, { cache: "no-store" });
    return { data: (await r.json()) as T, offline: true };
  }
}

export const api = {
  meta: () => get<Meta>("/meta", "/demo/meta.json"),
  fields: (qs = "") =>
    get<FeatureCollection>(`/fields${qs}`, "/demo/fields.json"),
  alerts: () =>
    get<{ alerts: Alert[]; demo: boolean }>(
      "/alerts?limit=50",
      "/demo/alerts.json"
    ),
  basins: () => get<FeatureCollection>("/basins", "/demo/basins.json"),
  basinHealth: (id: string) =>
    get<BasinHealth>(`/basins/${id}/health`, `/demo/health_${id}.json`),
  forecast: (id: string) =>
    get<Forecast>(`/basins/${id}/forecast`, "/demo/forecast.json"),
  impact: () => get<Impact>("/impact/summary", "/demo/impact.json"),
  validation: () =>
    get<Validation>("/validation/summary", "/demo/validation.json"),

  async patchStatus(id: string, status: Status): Promise<boolean> {
    try {
      const r = await fetch(`${BASE}/fields/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return r.ok;
    } catch {
      return false; // offline: caller keeps optimistic local state
    }
  },
};
