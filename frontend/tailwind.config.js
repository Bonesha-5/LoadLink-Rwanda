/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#3D2923',
        'sidebar-hover': '#4A342C',
        accent: '#E85D04',
        'accent-hover': '#F48C36',
        cream: '#F5F0E8',
        sand: '#FAFAF9',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
