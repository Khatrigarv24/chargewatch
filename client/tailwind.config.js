/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#0a0d10",
        surface: "#12161b",
        "surface-raised": "#161b21",
        ink: "#e7ecf0",
        muted: "#8b96a3",
        line: "rgba(231, 236, 240, 0.09)",
        accent: "#35e7b7",
        status: {
          available: "#35e7b7",
          charging: "#3ba7ff",
          faulted: "#ff6b5c",
          offline: "#7b8290",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};
