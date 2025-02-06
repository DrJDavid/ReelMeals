/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f7ff",
          100: "#ebf0fe",
          200: "#d7e0fd",
          300: "#b6c7fb",
          400: "#8fa4f8",
          500: "#6b82f4",
          600: "#4a5eea",
          700: "#3c4bd4",
          800: "#3440ac",
          900: "#2f3a8a",
          950: "#1c2251",
        },
      },
    },
  },
  plugins: [],
};
