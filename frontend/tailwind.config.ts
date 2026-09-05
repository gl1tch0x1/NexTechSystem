import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        tech: {
          blue: "#2563EB",
          cyan: "#06B6D4",
          dark: "#0F172A",
          darker: "#090D16",
          slate: "#1E293B",
          card: "#0F172A",
          surface: "#1E293B",
          light: "#F8FAFC",
          muted: "#94A3B8",
          border: "#1E293B",
          accent: "#3B82F6",
        },
        status: {
          success: "#16A34A",
          warning: "#F59E0B",
          error: "#DC2626",
          info: "#0284C7",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        'tech-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'tech': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'tech-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'tech-glow': '0 0 20px -3px rgba(37, 99, 235, 0.25)',
      }
    },
  },
  plugins: [],
};

export default config;
