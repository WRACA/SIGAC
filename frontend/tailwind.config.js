/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        negro: "#060606",
        gris: "#141414",
        borde: "#2a2a2a",
        naranja: "#f26d21",
        texto: "#f2f2f2",
        suave: "#b5b5b5",
        acento: "#ff5a00",
      },
      fontFamily: {
        sans: ["Barlow", "sans-serif"],
        display: ["Barlow Condensed", "sans-serif"],
      },
    },
  },
  plugins: [],
};
