import type { Config } from "tailwindcss";

// MIZAN design system — "Royal Indigo": deep indigo-black surfaces, an
// indigo→blue accent used sparingly, institutional / enterprise restraint.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#060814",
        bg2: "#0C1024",
        surface: "#12152A",
        panel: "#12152A",
        panel2: "#161B33",
        line: "#232A45",
        line2: "#2F3860",
        ink: "#EEF2FF",
        muted: "#A5ADCB",
        faint: "#6B7392",
        accent: "#6366F1",
        violet: "#3B82F6",
        accent2: "#3B82F6",
        mint: "#818CF8",
        red: "#F87171",
        amber: "#FBBF24",
        green: "#34D399",
        info: "#6366F1",
      },
      fontFamily: {
        head: ["var(--font-inter)", "var(--font-almarai)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "var(--font-tajawal)", "system-ui", "sans-serif"],
      },
      letterSpacing: { tightest: "-0.03em" },
      boxShadow: {
        e1: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 1px 2px 0 rgba(0,0,0,0.6)",
        e2: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -20px rgba(0,0,0,0.85)",
        e3: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -28px rgba(0,0,0,0.9)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        pulseDot: {
          "0%,100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.25)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.45s cubic-bezier(0.22,0.61,0.36,1) both",
        pulseDot: "pulseDot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
