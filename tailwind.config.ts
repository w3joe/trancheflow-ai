import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#070B14",
        panel: "#0E1525",
        paypal: {
          cobalt: "#0070BA",
          cyan: "#00B4D8",
          gold: "#FFC439",
        },
      },
    },
  },
  plugins: [],
};

export default config;
