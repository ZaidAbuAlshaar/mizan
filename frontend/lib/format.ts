export const fmtInt = (n: number, lang: "ar" | "en" = "en") =>
  new Intl.NumberFormat(lang === "ar" ? "ar-JO" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

export const fmt1 = (n: number, lang: "ar" | "en" = "en") =>
  new Intl.NumberFormat(lang === "ar" ? "ar-JO" : "en-US", {
    maximumFractionDigits: 1,
  }).format(n || 0);

/** Compact millions for big counters: 5,575,500 -> "5.58M" / "٥٫٥٨ م" */
export function fmtM3(n: number, lang: "ar" | "en" = "en"): string {
  if (n >= 1e6) return `${fmt1(n / 1e6, lang)}${lang === "ar" ? " م" : "M"}`;
  if (n >= 1e3) return `${fmt1(n / 1e3, lang)}${lang === "ar" ? " ألف" : "K"}`;
  return fmtInt(n, lang);
}

export const levelColor: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
};

export const levelDot: Record<string, string> = {
  red: "🔴",
  amber: "🟠",
  green: "🟢",
};
