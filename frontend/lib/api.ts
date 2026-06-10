// API layer with a graceful offline fallback.
// On load it probes the backend ONCE. If the backend isn't running, every
// call quietly serves the bundled labeled demo JSON from /public/demo — so the
// dashboard works fully standalone (no backend, no flooded console, no crash).
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

// single shared probe — all calls await the same result (1 request, not N)
let reach: Promise<boolean> | null = null;
function backendUp(): Promise<boolean> {
  if (!reach) {
    reach = fetch(`${BASE}/health`, { cache: "no-store" })
      .then((r) => r.ok)
      .catch(() => false);
  }
  return reach;
}

async function bundle<T>(fallback: string): Promise<Result<T>> {
  const r = await fetch(fallback, { cache: "no-store" });
  return { data: (await r.json()) as T, offline: true };
}

async function get<T>(path: string, fallback: string): Promise<Result<T>> {
  if (await backendUp()) {
    try {
      const r = await fetch(`${BASE}${path}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      return { data: (await r.json()) as T, offline: false };
    } catch {
      return bundle<T>(fallback);
    }
  }
  return bundle<T>(fallback);
}

export const api = {
  meta: () => get<Meta>("/meta", "/demo/meta.json"),
  fields: (qs = "") => get<FeatureCollection>(`/fields${qs}`, "/demo/fields.json"),
  alerts: () =>
    get<{ alerts: Alert[]; demo: boolean }>("/alerts?limit=50", "/demo/alerts.json"),
  basins: () => get<FeatureCollection>("/basins", "/demo/basins.json"),
  basinHealth: (id: string) =>
    get<BasinHealth>(`/basins/${id}/health`, `/demo/health_${id}.json`),
  forecast: (id: string) =>
    get<Forecast>(`/basins/${id}/forecast`, "/demo/forecast.json"),
  impact: () => get<Impact>("/impact/summary", "/demo/impact.json"),
  validation: () => get<Validation>("/validation/summary", "/demo/validation.json"),

  async patchStatus(id: string, status: Status): Promise<boolean> {
    if (!(await backendUp())) return false; // offline: keep optimistic local state
    try {
      const r = await fetch(`${BASE}/fields/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return r.ok;
    } catch {
      return false;
    }
  },
};
