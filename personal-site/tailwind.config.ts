import type { Config } from "tailwindcss";

const hsl = (v: string) => `hsl(var(${v}))`;
const hslA = (v: string) => `hsl(var(${v}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: hslA("--bg"),
        surface: hslA("--surface"),
        ink: hslA("--ink"),
        muted: hslA("--muted"),
        border: hslA("--border"),
        primary: hslA("--primary"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
