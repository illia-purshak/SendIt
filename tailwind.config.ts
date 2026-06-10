/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─── Neutral ───────────────────────────────────────────────────
        neutral: {
          900: "#262626",
          700: "#404040",
          600: "#5A5A5A",
          500: "#737373",
          400: "#919191",
          300: "#D6D6D6",
          200: "#E5E5E5",
          100: "#F5F5F5",
          50: "#FFFFFF",
        },

        // ─── Semantic — Info ───────────────────────────────────────────
        info: {
          900: "#0D3A6B",
          600: "#255C99",
          300: "#7EA3CC",
          100: "#D6E8F7",
        },

        // ─── Semantic — Warning ────────────────────────────────────────
        warning: {
          900: "#7A4000",
          500: "#FF8E1E",
          300: "#FFBC72",
          100: "#FFF0DC",
        },

        // ─── Semantic — Error ──────────────────────────────────────────
        error: {
          900: "#7B1D1D",
          600: "#C0392B",
          300: "#E8837A",
          100: "#FDECEA",
        },

        // ─── Semantic — Success (teal brand) ───────────────────────────
        success: {
          900: "#134e4a",
          600: "#0f766e",
          400: "#2dd4bf",
          100: "#ccfbf1",
        },

        // ─── Helper — Brown & Pink ─────────────────────────────────────
        brown: {
          300: "#e99f5e",
          100: "#fdf0e3",
        },

        pink: {
          300: "#f090dd",
          100: "#fde8f9",
        },
      },
    },
  },
  plugins: [],
};
