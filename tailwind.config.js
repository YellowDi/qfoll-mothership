/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["Space Grotesk", "IBM Plex Sans", "sans-serif"],
      },
      colors: {
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary:
          "rgb(var(--color-text-secondary) / calc(<alpha-value> * var(--color-text-secondary-opacity, 1)))",
        "on-dark": "rgb(var(--color-text-on-dark) / <alpha-value>)",
        "on-dark-secondary": "rgb(var(--color-text-on-dark-secondary) / <alpha-value>)",
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        ink: "rgb(var(--color-text-primary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / calc(<alpha-value> * var(--color-muted-opacity, 1)))",
        line: "rgb(var(--color-line) / calc(<alpha-value> * var(--color-line-opacity, 1)))",
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
