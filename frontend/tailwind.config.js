/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        acento: '#ff5a00', // Agrego este color personalizado que usaste en tu Login.jsx
      }
    },
  },
  plugins: [],
}