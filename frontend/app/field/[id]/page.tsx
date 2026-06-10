"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import EvidencePanel from "@/components/EvidencePanel";
import Skeleton from "@/components/Skeleton";
import type { FeatureCollection, FieldProps, Status } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <Skeleton className="h-[440px] w-full" />,
});

function centroid(g: any): [number, number] {
  if (g.type === "Point") return g.coordinates;
  const r = g.coordinates[0];
  let x = 0,
    y = 0;
  for (const p of r) {
    x += p[0];
    y += p[1];
  }
  return [x / r.length, y / r.length];
}

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

export default function FieldPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const { t } = useI18n();
  const [field, setField] = useState<FieldProps | null>(null);
  const [focus, setFocus] = useState<FeatureCollection | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await api.fields();
      const f = r.data.features.find((x) => x.properties.id === id);
      if (!f) {
        setMissing(true);
        return;
      }
      const [lon, lat] = centroid(f.geometry);
      setField({ ...(f.properties as FieldProps), lon, lat });
      setFocus({ type: "FeatureCollection", features: [f] });
    })();
  }, [id]);

  function onStatus(_id: string, s: Status) {
    setField((p) => (p ? { ...p, status: s } : p));
  }

  return (
    <div className="space-y-3">
      <Link href="/queue" className="text-muted text-sm hover:text-ink">
        ← {t("back")}
      </Link>
      {missing && (
        <div className="panel p-10 text-center text-muted">
          <div className="mb-1 font-head text-lg">{id}</div>—
        </div>
      )}
      {!field && !missing && <Skeleton className="h-[440px]" />}
      {field && (
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MapView
              fields={focus ?? EMPTY}
              focus={focus}
              legend={false}
              height="440px"
            />
          </div>
          <div className="lg:col-span-2">
            <EvidencePanel
              field={field}
              onClose={() => history.back()}
              onStatus={onStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}
