"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import LangToggle from "./LangToggle";
import DemoBadge from "./DemoBadge";

const ITEMS = [
  { href: "/", icon: "🗺", key: "nav_map" },
  { href: "/queue", icon: "📋", key: "nav_queue" },
  { href: "/alerts", icon: "🔔", key: "nav_alerts" },
  { href: "/basin/azraq", icon: "📉", key: "nav_basin" },
  { href: "/impact", icon: "💧", key: "nav_impact" },
  { href: "/methodology", icon: "🔬", key: "nav_method" },
] as const;

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

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href.split("/").slice(0, 2).join("/"));

  return (
    <>
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5">
          <Link href="/" className="group flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-line bg-bg2 text-accent transition-transform group-hover:scale-105">
              ⚖
            </span>
            <span className="font-head text-lg font-extrabold tracking-tight">
              {t("brand")}
            </span>
          </Link>

          <nav className="mx-2 hidden flex-1 items-center gap-1 text-sm md:flex">
            {ITEMS.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`relative rounded-lg px-3 py-1.5 transition-colors ${
                    active ? "text-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="me-1 opacity-70">{it.icon}</span>
                  {t(it.key)}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-[11px] h-0.5 rounded-full bg-gradient-to-r from-accent to-accent2" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-2 md:ms-0">
            <DemoBadge demo={demo} offline={offline} />
            <LangToggle />
          </div>
        </div>
      </header>

      {/* mobile bottom tab bar (thumb zone) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-[600px] grid-cols-6">
          {ITEMS.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[9px] transition-colors ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <span className="text-base leading-none">{it.icon}</span>
                <span className="max-w-[56px] truncate">{t(it.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
