"use client";
import { useI18n } from "@/lib/i18n";

export default function DemoBadge({
  demo,
  offline,
}: {
  demo?: boolean;
  offline?: boolean;
}) {
  const { t } = useI18n();
  if (!demo && !offline) return null;
  return (
    <span className="inline-flex items-center gap-2">
      {demo && (
        <span className="chip border-amber/60 text-amber" title="UI-13">
          ● {t("demo")}
        </span>
      )}
      {offline && (
        <span className="chip border-accent/50 text-accent">
          ⤓ {t("offline")}
        </span>
      )}
    </span>
  );
}
