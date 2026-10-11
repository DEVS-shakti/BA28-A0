import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { ink: "#08111f", panel: "#0f1b2d", line: "#20334d", electric: "#6ea8fe" } } },
  plugins: [],
};

export default config;
