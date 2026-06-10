"use client";
import type { FieldProps } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { fmtInt } from "@/lib/format";
import ScoreBadge from "./ScoreBadge";

/** Inspection queue — the 8 columns of the spec (constitution §13):
 *  rank · id+GPS · area · first seen · m³/yr · score · status · evidence */
export default function FieldTable({
  fields,
  onSelect,
  selectedId,
}: {
  fields: FieldProps[];
  onSelect: (f: FieldProps) => void;
  selectedId?: string;
}) {
  const { t, lang } = useI18n();
  const sorted = [...fields].sort((a, b) => b.score - a.score);
  const stLabel = (s: string) =>
    t(`st_${s}` as "st_new" | "st_inspected" | "st_confirmed" | "st_cleared");

  return (
    <div className="panel overflow-hidden">
      <div className="max-h-[72vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-panel2 text-muted">
            <tr>
              <th className="p-2 text-start font-medium">{t("rank")}</th>
              <th className="p-2 text-start font-medium">{t("id_gps")}</th>
              <th className="p-2 text-start font-medium">{t("area")}</th>
              <th className="p-2 text-start font-medium">{t("first_seen")}</th>
              <th className="p-2 text-start font-medium">{t("est_m3")}</th>
              <th className="p-2 text-start font-medium">{t("score")}</th>
              <th className="p-2 text-start font-medium">{t("status")}</th>
              <th className="p-2 text-start font-medium">{t("evidence")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => (
              <tr
                key={f.id}
                onClick={() => onSelect(f)}
                className={`cursor-pointer border-t border-line transition-colors hover:bg-panel2 ${
                  selectedId === f.id ? "bg-panel2 shadow-[inset_2px_0_0_#2dd4bf]" : ""
                }`}
              >
                <td className="stat p-2 text-muted">{i + 1}</td>
                <td className="p-2">
                  <div className="font-head leading-tight">{f.id}</div>
                  {f.lat != null && (
                    <div className="ltr stat text-[10px] text-muted">
                      {f.lat.toFixed(3)}, {f.lon!.toFixed(3)}
                    </div>
                  )}
                </td>
                <td className="stat p-2">{f.area_ha}</td>
                <td className="stat p-2">
                  {f.first_seen_year}
                  {f.is_new && (
                    <span className="ms-1 align-middle text-[9px] text-red">●</span>
                  )}
                </td>
                <td className="stat p-2 text-accent">{fmtInt(f.est_m3yr, lang)}</td>
                <td className="p-2">
                  <ScoreBadge score={f.score} />
                </td>
                <td className="p-2">
                  <span className="chip text-muted">{stLabel(f.status)}</span>
                </td>
                <td className="p-2">
                  <button
                    className="btn !px-2 !py-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(f);
                    }}
                  >
                    🔍 {t("evidence")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="p-8 text-center text-muted">—</div>
        )}
      </div>
    </div>
  );
}
