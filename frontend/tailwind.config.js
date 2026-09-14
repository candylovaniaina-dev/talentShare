/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <- ajoute ça aussi, nécessaire pour le point 2
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1633', light: '#121F49' },
        mint: { DEFAULT: '#6EE7C8', dark: '#4FD1B0' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(110,231,200,0.35)' },
          '50%': { boxShadow: '0 0 0 14px rgba(110,231,200,0)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-delayed': 'float 4s ease-in-out infinite 1.2s',
        'float-slow': 'float 5.5s ease-in-out infinite 0.6s',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};