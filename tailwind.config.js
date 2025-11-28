/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'nv-blue': '#5B9BD5',
        'td-red': '#E74C3C',
        'measure-green': '#2ECC71',
        'measure-yellow': '#F1C40F',
      }
    },
  },
  plugins: [],
}
