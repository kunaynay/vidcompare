/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'IBM Plex Mono'", 'monospace'],
        mono: ["'IBM Plex Mono'", 'monospace'],
        body: ["'DM Sans'", 'sans-serif'],
      },
      colors: {
        surface: {
          50: '#fafafa',
          100: '#e8e8e8',
          200: '#d1d1d6',
          300: '#a0a0a0',
          400: '#6a6a6a',
          500: '#353535',
          600: '#2a2a2a',
          700: '#202020',
          800: '#1a1a1a',
          850: '#151515',
          900: '#0d0d0d',
          950: '#050505',
        },
        accent: {
          50: '#fff8eb',
          100: '#ffefc2',
          200: '#ffe099',
          300: '#ffc266',
          400: '#ffb347',
          500: '#ffb347',
          600: '#cc8f39',
          700: '#a07030',
          800: '#7a5525',
          900: '#5c401d',
          950: '#3a2810',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#450a0a',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        glow: {
          amber: 'rgba(255, 179, 71, 0.15)',
          amberStrong: 'rgba(255, 179, 71, 0.25)',
        }
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '4px',
        'lg': '6px',
        'xl': '6px',
        '2xl': '6px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(255, 179, 71, 0.15)',
        'glow-lg': '0 0 40px rgba(255, 179, 71, 0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-scale': 'fadeInScale 400ms cubic-bezier(0.4, 0, 0.2, 1) backwards',
        'slide-up': 'slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slideIn 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'floatUpDown 3s ease-in-out infinite',
        'float-small': 'floatUpDownSmall 2s ease-in-out infinite',
        'ping-stage': 'pingStage 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(400px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        floatUpDown: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatUpDownSmall: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 179, 71, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 179, 71, 0.3)' },
        },
        pingStage: {
          '75%, 100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
