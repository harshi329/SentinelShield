/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#020617",
          surface: "#0F172A",
          card: "#111827",
          border: "#1E293B",
        },

        warm: {
          bg: "#F8F5F0",
          surface: "#FFFDF8",
          card: "#FFFFFF",
          border: "#E7E5E4",
        },
      },
    },
  },
  plugins: [],
}
