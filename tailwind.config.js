/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Trirong", "Noto Serif SC", "Georgia", "serif"],
        hanzi: ["Noto Serif SC", "Trirong", "Georgia", "serif"],
        body: ["IBM Plex Sans Thai", "Noto Sans Thai", "system-ui", "sans-serif"],
      },
      boxShadow: {
        game: "0 18px 0 rgba(96, 38, 16, 0.35), 0 28px 45px rgba(64, 25, 18, 0.22)",
        glow: "0 0 26px rgba(255, 197, 86, 0.65)",
      },
      colors: {
        jade: "#2f8f74",
        cinnabar: "#b62924",
        vermilion: "#dd3a2d",
        lacquer: "#6e1716",
        parchment: "#fff1cd",
        gold: "#f7b833",
      },
    },
  },
  plugins: [],
};
