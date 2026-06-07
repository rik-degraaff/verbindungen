/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        tile: '0 2px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
