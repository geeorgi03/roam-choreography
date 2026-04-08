/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'roam-ground': '#f9f7f4',
        'roam-active': '#3a342d',
        'roam-mine': '#7db9a8',
        'roam-amber': '#e8a87c',
        'roam-muted': '#9e9189',
        'roam-border': '#e8e3dc',
        'roam-chrome': '#ffffff',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
