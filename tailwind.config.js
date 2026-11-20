/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'epr-enter': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'epr-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'epr-mega': {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'epr-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        'epr-spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'epr-shine': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'epr-marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'epr-blob': {
          '0%, 100%': { transform: 'scale(1) translate(0, 0)' },
          '50%': { transform: 'scale(1.08) translate(12px, -8px)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'epr-enter': 'epr-enter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'epr-fade': 'epr-fade 0.45s ease-out both',
        'epr-mega': 'epr-mega 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'epr-float': 'epr-float 4.5s ease-in-out infinite',
        'epr-spin-slow': 'epr-spin-slow 28s linear infinite',
        'epr-shine': 'epr-shine 1.4s ease-in-out',
        'epr-marquee': 'epr-marquee 28s linear infinite',
        'epr-blob': 'epr-blob 12s ease-in-out infinite',
      },
      fontFamily: {
        tangent: ['Poppins', 'sans-serif'],
        tricks: ['"DM Serif Display"', 'serif'],
        germalt: ['"Exo 2"', 'sans-serif'],
        sublim: ['Sora', 'sans-serif'],
        luksora: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        // EPR Compass homepage theme: plum, lavender, cream and amber
        'eco-green-1': '#f0e6fa',
        'eco-green-2': '#e9dcf5',
        'eco-green-3': '#35145f',
        'eco-green-4': '#4a2183',
        'eco-green-5': '#3f1b66',
        'eco-navy': '#28104f',
        'eco-navy-light': '#3f1b66',
        'eco-ocean': '#e98200',
        'eco-ocean-light': '#ffbd55',
      },
      backgroundImage: {
        'eco-gradient-b':       'linear-gradient(to bottom, #4a2183, #35145f)',
        'eco-gradient-r':       'linear-gradient(to right, #4a2183, #35145f)',
        'eco-gradient-tl':      'linear-gradient(to top left, #4a2183, #28104f)',
        'eco-gradient-tr':      'linear-gradient(to top right, #4a2183, #28104f)',
        'eco-gradient-bl':      'linear-gradient(to bottom left, #4a2183, #28104f)',
        'eco-gradient-br':      'linear-gradient(to bottom right, #4a2183, #28104f)',
        'eco-gradient-b-rev':   'linear-gradient(to bottom, #35145f, #4a2183)',
        'eco-gradient-r-rev':   'linear-gradient(to right, #35145f, #4a2183)',
        'eco-gradient-tl-rev':  'linear-gradient(to top left, #28104f, #4a2183)',
        'eco-gradient-tr-rev':  'linear-gradient(to top right, #28104f, #4a2183)',
        'eco-gradient-bl-rev':  'linear-gradient(to bottom left, #28104f, #4a2183)',
        'eco-gradient-br-rev':  'linear-gradient(to bottom right, #28104f, #4a2183)',
        'epr-cta':             'linear-gradient(105deg, #562685 0%, #3f1b66 42%, #28104f 100%)',
      },
    },
  },
  plugins: [],
};

