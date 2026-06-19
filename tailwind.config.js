/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanken Grotesk', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fff0f0',
          100: '#ffd8d8',
          200: '#ffb3b3',
          300: '#ff8585',
          400: '#f44',
          500: '#E11D2A',
          600: '#c9181f',
          700: '#a61219',
          800: '#820e14',
          900: '#5e0a0f',
        },
      },
    },
  },
  plugins: [],
}
