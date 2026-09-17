/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        base: {
          950: '#070b14',
          900: '#0b1120',
          850: '#0f1626',
          800: '#131c30',
          750: '#1a2440',
          700: '#222e4d',
          600: '#2e3d63',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        ok: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
        warn: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        err: { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,0.12), 0 8px 30px -8px rgba(6,182,212,0.25)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 1px 2px 0 rgba(0,0,0,0.4)',
      },
      keyframes: {
        'pulse-soft': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'flow-dash': {
          to: { strokeDashoffset: '-40' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'flow-dash': 'flow-dash 1.2s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
