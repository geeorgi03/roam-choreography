/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'roam-shell': '#1c1c1e',
        'roam-ground': '#09090e',
        'roam-active': '#fafafa',
        'roam-muted': 'rgba(255,255,255,0.35)',
        'roam-muted-mid': 'rgba(255,255,255,0.75)',
        'roam-primary': '#ff2d6b',
        'roam-border': 'rgba(255,255,255,0.1)',
        'roam-chrome': '#2c2c2e',
      },
      fontFamily: {
        display: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        tile: '0 2px 12px rgba(0,0,0,0.4)',
        'tile-soft': '0 2px 12px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
};
