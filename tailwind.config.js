/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */

import flowbite from 'flowbite-react/tailwind'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', flowbite.content()],
  theme: {
    extend: {},
  },
  plugins: [require('nightwind'), flowbite.plugin()],
}
