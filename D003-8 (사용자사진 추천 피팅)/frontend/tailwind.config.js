/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primaryBg: '#FDFBF7',
        surfaceCard: '#FFFFFF',
        secondaryBg: '#F4EFEA',
        primaryAccent: '#A25966',
        primaryAccentHover: '#8C4753',
        secondaryAccent: '#6B2D39',
        neutralDark: '#2C2825',
        neutralLight: '#E5DED4',
        statusGold: '#D4A373',
      },
    },
  },
  plugins: [],
};

