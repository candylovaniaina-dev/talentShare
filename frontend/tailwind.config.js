/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          50: '#EEF3FA',
          100: '#D5E1F0',
          200: '#A8C0DF',
          300: '#7B9CCF',
          400: '#4D77BF',
          500: '#2A5BA8',
          600: '#1A4275',
          700: '#122E54',
          light: '#15264D',
          800: '#0B1F3A',
          900: '#071428',
        },
        mint: {
          DEFAULT: '#14B8A6',
          light: '#5EEAD4',
          dark: '#0D9488',
        },
        ink: {
          DEFAULT: '#0F172A',
          light: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        cardHover: '0 4px 12px 0 rgba(15, 23, 42, 0.08), 0 2px 4px 0 rgba(15, 23, 42, 0.04)',
        pop: '0 8px 24px 0 rgba(15, 23, 42, 0.10), 0 2px 8px 0 rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        'xl2': '12px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(20,184,166,0.25)' },
          '50%': { boxShadow: '0 0 0 12px rgba(20,184,166,0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-delayed': 'float 4s ease-in-out infinite 1.2s',
        'float-slow': 'float 5.5s ease-in-out infinite 0.6s',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
