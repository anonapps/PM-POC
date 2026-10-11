import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [heroui({ themes: { light: { colors: { primary: { DEFAULT: "#2563eb", foreground: "#ffffff" } } } } })],
};

export default config;
