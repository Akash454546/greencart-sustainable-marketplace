/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F9F6F0',
        forest: {
          DEFAULT: '#1A4A2E',
          light: '#2D6B45',
          dark: '#0F3420',
        },
        amber: {
          DEFAULT: '#D4821A',
          light: '#E8A44C',
          dark: '#B06B10',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
