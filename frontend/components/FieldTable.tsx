"use client";
import type { FieldProps } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { fmtInt } from "@/lib/format";
import ScoreBadge from "./ScoreBadge";

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
          <thead className="sticky top-0 bg-panel2 text-muted">
            <tr className="text-start">
              <th className="p-2 text-start font-medium">{t("rank")}</th>
              <th className="p-2 text-start font-medium">{t("id")}</th>
              <th className="p-2 text-start font-medium">{t("area")}</th>
              <th className="p-2 text-start font-medium">{t("first_seen")}</th>
              <th className="p-2 text-start font-medium">{t("est_m3")}</th>
              <th className="p-2 text-start font-medium">{t("score")}</th>
              <th className="p-2 text-start font-medium">{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => (
              <tr
                key={f.id}
                onClick={() => onSelect(f)}
                className={`cursor-pointer border-t border-line transition-colors hover:bg-panel2 ${
                  selectedId === f.id ? "bg-panel2" : ""
                }`}
              >
                <td className="stat p-2 text-muted">{i + 1}</td>
                <td className="p-2 font-head">{f.id}</td>
                <td className="stat p-2">{f.area_ha}</td>
                <td className="stat p-2">{f.first_seen_year}</td>
                <td className="stat p-2 text-accent">{fmtInt(f.est_m3yr, lang)}</td>
                <td className="p-2">
                  <ScoreBadge score={f.score} />
                </td>
                <td className="p-2">
                  <span className="chip text-muted">{stLabel(f.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
