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
        background: "#09090B",
        surface: "#111113",
        card: "#18181B",
        border: "#27272A",

        primary: "#DC2626",
        "primary-hover": "#B91C1C",

        foreground: "#FAFAFA",
        muted: "#A1A1AA",
      },
    },
  },
  plugins: [],
};

export default config;