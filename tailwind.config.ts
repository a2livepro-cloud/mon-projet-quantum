import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        quantum: {
          bg: "#080B12",
          surface: "#0E1420",
          accent: "#3B82F6",
          cyan: "#06B6D4",
          gold: "#F59E0B",
          border: "rgba(59, 130, 246, 0.2)",
        },
      },
      fontFamily: {
        syne: ["var(--font-syne)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      fontWeight: {
        "syne-bold": "700",
        "syne-extrabold": "800",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
