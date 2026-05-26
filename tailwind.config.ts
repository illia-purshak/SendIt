/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ─── Primary — Green ───────────────────────────────────────────
        green: {
          950: "#0D3D33", // Deep Forest   — navbar, dark bg
          700: "#1F6F5F", // Blue Spruce   — primary ★
          500: "#2A9E88", // Sea Green     — hover / active
          400: "#3FE7A4", // Tropical Mint — accent / CTA
          200: "#A8F5D8", // Soft Mint     — tag / badge bg
          100: "#D3FFED", // Frozen Water  — light tint / bg
        },

        // ─── Neutral ───────────────────────────────────────────────────
        neutral: {
          900: "#262626", // Carbon Black  — primary text
          600: "#5A5A5A", // Muted Grey    — secondary text
          400: "#919191", // Mid Grey      — gray/destructive helper
          300: "#D6D6D6", // Dust Grey     — border / divider
          100: "#F5F5F5", // Off White     — card / surface
          50: "#FFFFFF", // White         — page bg
        },

        // ─── Muted / Dark theme helpers ────────────────────────────────
        muted: {
          950: "#1A1A2E", // Night Navy    — dark mode page bg
          900: "#24243E", // Dark Surface  — dark mode card bg
          800: "#3D2B4F", // Deep Plum     — dark mode accent bg
          blue: "#7EA3CC", // Wisteria Blue — muted border / dark mode border
          pink: "#FF5E76", // Bubblegum Pink — muted highlight
        },

        // ─── Semantic — Info ───────────────────────────────────────────
        info: {
          900: "#0D3A6B", // Deep Blue
          600: "#255C99", // Baltic Blue ★
          300: "#7EA3CC", // Wisteria Blue
          100: "#D6E8F7", // Sky Tint
        },

        // ─── Semantic — Warning ────────────────────────────────────────
        warning: {
          900: "#7A4000", // Burnt
          500: "#FF8E1E", // Dark Orange ★
          300: "#FFBC72", // Pale Orange
          100: "#FFF0DC", // Cream
        },

        // ─── Semantic — Error ──────────────────────────────────────────
        error: {
          900: "#7B1D1D", // Deep Red
          600: "#C0392B", // Crimson ★
          300: "#E8837A", // Soft Red
          100: "#FDECEA", // Blush
        },

        // ─── Helper — Brown & Pink ─────────────────────────────────────
        brown: {
          300: "#e99f5e", // Caramel — main helper shade
          100: "#fdf0e3", // Peach tint — hover bg
        },

        pink: {
          300: "#f090dd", // Orchid — main helper shade
          100: "#fde8f9", // Blush tint — hover bg
        },

        // ─── Semantic — Success (aliases primary green) ────────────────
        success: {
          900: "#0D3D33", // Deep Forest
          600: "#1F6F5F", // Blue Spruce ★
          400: "#3FE7A4", // Tropical Mint
          100: "#D3FFED", // Frozen Water
        },
      },
    },
  },
  plugins: [],
};
