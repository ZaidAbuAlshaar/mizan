import type { Config } from "tailwindcss";

// MIZAN identity (constitution §13): space control room — navy/charcoal +
// turquoise, unified P4 status colors red/amber/green.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0f1e",
        panel: "#111a2e",
        panel2: "#16213b",
        line: "#243152",
        ink: "#e9eefc",
        muted: "#94a4c6",
        accent: "#2dd4bf",
        accent2: "#22d3ee",
        red: "#ef4444",
        amber: "#f59e0b",
        green: "#22c55e",
      },
      fontFamily: {
        head: ["var(--font-almarai)", "system-ui", "sans-serif"],
        body: ["var(--font-tajawal)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
export default config;
