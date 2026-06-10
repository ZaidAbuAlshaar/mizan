"use client";
import { useEffect, useState } from "react";
import type { FieldProps, Status } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { fmtInt } from "@/lib/format";
import ScoreBadge from "./ScoreBadge";
import NdviChart from "./NdviChart";
import ImageCompare from "./ImageCompare";

const STATUSES: Status[] = ["new", "inspected", "confirmed", "cleared"];
const STATUS_TONE: Record<Status, string> = {
  new: "border-red/60 text-red",
  inspected: "border-amber/60 text-amber",
  confirmed: "border-accent/60 text-accent",
  cleared: "border-green/60 text-green",
};
const COMPONENT_LABEL: Record<string, { ar: string; en: string }> = {
  inside_protected_basin: { ar: "داخل حوض محظور", en: "Inside protected basin" },
  is_new_after_closure: { ar: "جديد بعد الإغلاق", en: "New after closure" },
  active_in_zero_rain_months: { ar: "نشِط بأشهر بلا مطر", en: "Active in rainless months" },
  distance_to_nearest_licensed_well: { ar: "بُعد عن بئر مرخّص", en: "Far from licensed well" },
  area_ha: { ar: "المساحة", en: "Area" },
  expansion_rate: { ar: "معدّل التوسّع", en: "Expansion rate" },
};
const WEIGHTS: Record<string, number> = {
  inside_protected_basin: 30,
  is_new_after_closure: 20,
  active_in_zero_rain_months: 15,
  distance_to_nearest_licensed_well: 15,
  area_ha: 10,
  expansion_rate: 10,
};

export default function EvidencePanel({
  field,
  onClose,
  onStatus,
}: {
  field: FieldProps;
  onClose: () => void;
  onStatus?: (id: string, s: Status) => void;
}) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<Status>(field.status);
  const [saving, setSaving] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => setStatus(field.status), [field.id, field.status]);

  async function change(s: Status) {
    setSaving(s);
    setStatus(s); // optimistic
    await api.patchStatus(field.id, s);
    onStatus?.(field.id, s);
    setSaving(null);
  }

  async function copyCoords() {
    if (field.lat == null || field.lon == null) return;
    try {
      await navigator.clipboard.writeText(`${field.lat}, ${field.lon}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const comps = field.score_components || {};
  const stLabel = (s: Status) =>
    t(`st_${s}` as "st_new" | "st_inspected" | "st_confirmed" | "st_cleared");

  return (
    <div className="panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line p-3">
        <div className="flex items-center gap-2">
          <span className="font-head font-bold">{field.id}</span>
          <ScoreBadge score={field.score} />
          <span className={`chip ${STATUS_TONE[status]}`}>{stLabel(status)}</span>
        </div>
        <button className="btn" onClick={onClose} aria-label="close">
          ✕
        </button>
      </div>

      <div className="max-h-[68vh] overflow-y-auto">
        <div className="grid grid-cols-3 gap-2 p-3 text-center text-sm">
          <div>
            <div className="text-muted text-[11px]">{t("area")}</div>
            <div className="stat">{field.area_ha}</div>
          </div>
          <div>
            <div className="text-muted text-[11px]">{t("first_seen")}</div>
            <div className="stat">{field.first_seen_year}</div>
          </div>
          <div>
            <div className="text-muted text-[11px]">{t("est_m3")}</div>
            <div className="stat text-accent">{fmtInt(field.est_m3yr, lang)}</div>
          </div>
        </div>

        {field.lat != null && field.lon != null && (
          <div className="mx-3 mb-2 flex items-center justify-between rounded-lg border border-line bg-panel2 px-3 py-1.5">
            <span className="ltr stat text-xs text-muted">
              {field.lat.toFixed(5)}, {field.lon.toFixed(5)}
            </span>
            <button className="btn !py-0.5 text-xs" onClick={copyCoords}>
              {copied ? t("copied") : `📋 ${t("copy_coords")}`}
            </button>
          </div>
        )}

        <div className="px-3">
          <div className="text-muted mb-1 text-[11px]">{t("before_after")}</div>
          <ImageCompare
            before="/demo/before_2016.svg"
            after="/demo/after_2026.svg"
            beforeLabel="2016"
            afterLabel="2026"
          />
          <div className="mt-1 text-center text-[10px] text-amber/80">
            ● {t("demo")} — Sentinel-2/Landsat via GEE
          </div>
        </div>

        <div className="px-3 pt-2">
          <div className="text-muted mb-1 text-[11px]">{t("ndvi")}</div>
          {field.ndvi_series ? (
            <div className="ltr">
              <NdviChart series={field.ndvi_series} />
            </div>
          ) : (
            <div className="text-muted py-6 text-center text-xs">—</div>
          )}
        </div>

        <div className="p-3">
          <div className="text-muted mb-1.5 text-[11px]">{t("components")}</div>
          <div className="space-y-1.5">
            {Object.entries(comps).map(([k, v]) => {
              const w = WEIGHTS[k] ?? 0;
              const pts = Math.round((v as number) * w);
              return (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-36 shrink-0 text-muted">
                    {COMPONENT_LABEL[k]?.[lang] ?? k}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded bg-panel2">
                    <div
                      className="h-full rounded bg-gradient-to-r from-accent to-accent2 transition-all"
                      style={{ width: `${(pts / w) * 100 || 0}%` }}
                    />
                  </div>
                  <span className="stat w-10 text-end">
                    {pts}/{w}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-line p-3">
        <div className="text-muted mb-1.5 text-[11px]">{t("update_status")}</div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => change(s)}
              disabled={saving !== null}
              className={`btn ${status === s ? STATUS_TONE[s] : "text-muted"}`}
            >
              {saving === s ? "…" : stLabel(s)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
