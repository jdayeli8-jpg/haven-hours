/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F4ED',
        linen: '#EAE4D8',
        ink: '#23201C',
        stone2: '#8B8276',
        iris: {
          DEFAULT: '#5B5170',
          deep: '#463E59',
          tint: '#E9E5F0',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Karla', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wider2: '0.18em',
      },
    },
  },
  plugins: [],
}
