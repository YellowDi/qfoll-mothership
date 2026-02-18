/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "MiSans",
          "PingFang SC",
          "Microsoft YaHei UI",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Segoe UI",
          "Noto Sans CJK SC",
          "WenQuanYi Micro Hei",
          "Arial",
          "sans-serif",
        ],
        display: ["Space Grotesk", "IBM Plex Sans", "sans-serif"],
      },
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
      },
      borderRadius: {
        xl: "14px",
      },
      boxShadow: {
        soft: "0 18px 40px -28px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
};
