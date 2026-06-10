export type Level = "red" | "amber" | "green";
export type Status = "new" | "inspected" | "confirmed" | "cleared";

export interface Meta {
  demo: boolean;
  demo_label_ar: string | null;
  demo_label_en: string | null;
  fields_count: number;
  grace_phrase_ar?: string;
  grace_phrase_en?: string;
}

export interface FieldProps {
  id: string;
  basin: string;
  lat?: number;
  lon?: number;
  area_ha: number;
  first_seen_year: number;
  is_new: boolean;
  is_expanding: boolean;
  score: number;
  est_m3yr: number;
  est_m3yr_low: number;
  est_m3yr_high: number;
  status: Status;
  method?: string;
  note?: string | null;
  demo?: boolean;
  ndvi_series?: { month: string; ndvi: number }[];
  score_components?: Record<string, number>;
}

export interface Feature {
  type: "Feature";
  properties: FieldProps & Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}

export interface FeatureCollection {
  type: "FeatureCollection";
  properties?: Record<string, unknown> & { demo?: boolean; count?: number };
  features: Feature[];
}

export interface Alert {
  rank: number;
  id: string;
  basin: string;
  lat: number;
  lon: number;
  area_ha: number;
  first_seen_year: number;
  est_m3yr: number;
  score: number;
  status: Status;
  demo: boolean;
}

export interface BasinHealth {
  id: string;
  name_ar: string;
  name_en: string;
  stress_pct: number;
  stress_source?: string;
  level: Level;
  suspected_fields: number;
  demo: boolean;
}

export interface Impact {
  demo: boolean;
  red_fields: number;
  recoverable_m3yr: number;
  people_equivalent: number;
  usd_low: number;
  usd_high: number;
  jod_low: number;
  jod_high: number;
  carrier_share_pct: number;
  national_overdraft_m3: number;
  methodology_ar: string;
  methodology_en: string;
}

export interface Validation {
  demo: boolean;
  sites_total: number;
  sites_covered: number;
  statement_ar: string;
  statement_en: string;
  radius_km: number;
  precision_at_20: number | null;
  rows: {
    id: string;
    name_ar: string;
    name_en: string;
    date: string;
    nearest_red_km: number | null;
    covered: boolean;
  }[];
}

export interface Forecast {
  basin: string;
  demo: boolean;
  tws: {
    series: { month: string; anomaly_cm: number }[];
    gap?: [string, string];
    region_phrase_ar?: string;
    region_phrase_en?: string;
  };
  forecast: {
    engine: string;
    threshold_cm: number;
    critical_month: string | null;
    forecast: { month: string; yhat: number; lo: number; hi: number }[];
    region_phrase_ar?: string;
    region_phrase_en?: string;
  };
}

export function levelOf(score: number): Level {
  return score >= 70 ? "red" : score >= 40 ? "amber" : "green";
}
