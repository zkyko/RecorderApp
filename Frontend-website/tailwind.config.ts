import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        professional: {
          dark: "#0f172a",
          "dark-secondary": "#1e293b",
          "dark-tertiary": "#334155",
          accent: "#3b82f6",
          "accent-hover": "#2563eb",
          "accent-light": "#60a5fa",
          border: "#334155",
          "border-light": "#475569",
        },
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
  ],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#3b82f6",
          "primary-focus": "#2563eb",
          "primary-content": "#ffffff",
          "secondary": "#6366f1",
          "secondary-focus": "#4f46e5",
          "secondary-content": "#ffffff",
          "accent": "#10b981",
          "accent-focus": "#059669",
          "accent-content": "#ffffff",
          "neutral": "#1e293b",
          "neutral-focus": "#0f172a",
          "neutral-content": "#f1f5f9",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#f1f5f9",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
};

export default config;
