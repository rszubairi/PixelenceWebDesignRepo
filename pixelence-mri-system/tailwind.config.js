/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#dce5ff",
          500: "#4F6EF7",
          600: "#3B56E8",
          700: "#2A41CC",
          900: "#1a2a80",
        },
      },
    },
  },
  plugins: [],
};
