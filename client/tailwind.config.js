/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          500: '#ec4899', // Electric Rose
          600: '#db2777',
          700: '#be185d',
        },
        arohi: {
          violet: '#8b5cf6',
          fuchsia: '#d946ef',
          rose: '#f43f5e',
          indigo: '#6366f1',
          emerald: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
