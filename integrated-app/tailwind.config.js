/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        fashion: {
          dark: '#1e1b2e',
          card: '#28253d',
          gold: '#f59e0b',
          rose: '#f43f5e',
          accent: '#10b981',
          bg: '#0f0e17'
        }
      }
    },
  },
  plugins: [],
}

