import type { Config } from "tailwindcss";

// MIZAN design system — "orbital control room": deep space navy, glass
// surfaces, a teal→sky signal accent, and the unified P4 status colors.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#060912",
        bg2: "#0a0f1e",
        panel: "#0d1424",
        panel2: "#131d33",
        line: "#1d2942",
        ink: "#eef3ff",
        muted: "#8a9cc2",
        faint: "#56648a",
        accent: "#2dd4bf",
        accent2: "#38bdf8",
        red: "#f43f5e",
        amber: "#f59e0b",
        green: "#22c55e",
      },
      fontFamily: {
        head: ["var(--font-almarai)", "system-ui", "sans-serif"],
        body: ["var(--font-tajawal)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass:
          "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 18px 50px -28px rgba(0,0,0,0.9)",
        glow: "0 0 0 1px rgba(45,212,191,0.25), 0 8px 30px -8px rgba(45,212,191,0.35)",
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.15rem" },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        glowpulse: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s cubic-bezier(0.22,0.61,0.36,1) both",
        floaty: "floaty 6s ease-in-out infinite",
        glowpulse: "glowpulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
