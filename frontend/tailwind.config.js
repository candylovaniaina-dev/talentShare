/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <- ajoute ça aussi, nécessaire pour le point 2
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1F33', light: '#12364D' },
        mint: { DEFAULT: '#16B8B1', dark: '#0F9691' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(22,184,177,0.30)' },
          '50%': { boxShadow: '0 0 0 14px rgba(22,184,177,0)' },
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
