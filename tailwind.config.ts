import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        "neon-blue": "#0A1EFF",
        "bingo-orange": "#FF6B35",
        "bingo-yellow": "#FFD23F",
        "electric-blue": "#00E5FF",
        // Backgrounds
        "bg-primary": "#0A0E1A",
        "bg-secondary": "#141824",
        "bg-tertiary": "#1E2433",
        "bg-elevated": "#252D3F",
        "bg-chart": "#0F1419",
        // Text
        "text-primary": "#FFFFFF",
        "text-secondary": "#B4B9C5",
        "text-tertiary": "#8B91A0",
        // Borders
        "border-subtle": "rgba(255, 255, 255, 0.06)",
        "border-default": "rgba(255, 255, 255, 0.1)",
        "border-strong": "rgba(255, 255, 255, 0.15)",
      },
      fontFamily: {
        ui: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "neon-blue": "0 0 20px rgba(10, 30, 255, 0.3)",
        "electric": "0 0 20px rgba(0, 229, 255, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(10, 30, 255, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(10, 30, 255, 0.8)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        ticker: "ticker 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
