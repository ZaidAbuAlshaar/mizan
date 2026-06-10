import type { Config } from "tailwindcss";

// MIZAN design system — Linear/Vercel/Stripe restraint.
// Solid near-black surfaces, one cyan→violet accent, gradients used sparingly.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050505",
        bg2: "#0F1115",
        surface: "#171A21",
        panel: "#171A21",
        panel2: "#1C2029",
        line: "#232834",
        line2: "#2C3340",
        ink: "#F5F7FA",
        muted: "#A3AAB8",
        faint: "#6B7280",
        accent: "#00D9FF",
        violet: "#8B5CF6",
        accent2: "#8B5CF6",
        mint: "#00FFB2",
        red: "#FF5A5A",
        amber: "#FFB547",
        green: "#00FFB2",
        info: "#00D9FF",
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
