"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import LangToggle from "./LangToggle";
import DemoBadge from "./DemoBadge";

export default function Nav() {
  const { t } = useI18n();
  const path = usePathname();
  const [demo, setDemo] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api.meta().then((r) => {
      setDemo(Boolean(r.data.demo));
      setOffline(r.offline);
    });
  }, []);

  const items = [
    { href: "/", icon: "🗺", label: t("nav_map") },
    { href: "/queue", icon: "📋", label: t("nav_queue") },
    { href: "/alerts", icon: "🔔", label: t("nav_alerts") },
    { href: "/basin/azraq", icon: "📉", label: t("nav_basin") },
    { href: "/impact", icon: "💧", label: t("nav_impact") },
    { href: "/methodology", icon: "🔬", label: t("nav_method") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent">
            ⚖
          </span>
          <span className="font-head text-lg font-extrabold">{t("brand")}</span>
        </Link>
        <nav className="mx-2 flex flex-1 flex-wrap gap-1 text-sm">
          {items.map((it) => {
            const active =
              it.href === "/"
                ? path === "/"
                : path.startsWith(it.href.split("/").slice(0, 2).join("/"));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? "border border-line bg-panel2 text-accent"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span className="me-1 hidden sm:inline">{it.icon}</span>
                {it.label}
              </Link>
            );
          })}
        </nav>
        <DemoBadge demo={demo} offline={offline} />
        <LangToggle />
      </div>
    </header>
  );
}
