/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          card: 'var(--color-bg-card)',
          card2: 'var(--color-bg-card2)',
        },
        accent: {
          blue: '#3b82f6',
          'blue-light': '#60a5fa',
          green: '#10b981',
          'green-light': '#34d399',
          amber: '#f59e0b',
          'amber-light': '#fbbf24',
          red: '#ef4444',
          'red-light': '#f87171',
          purple: '#8b5cf6',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        border: {
          divider: 'var(--color-border-divider)',
        },
        filler: {
          bg: '#fef2f2',
          border: '#fca5a5',
          text: '#dc2626',
        },
        phone: {
          frame: '#000000',
          inner: '#f8f8fa',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        phone: '48px',
        'phone-inner': '38px',
      },
      boxShadow: {
        phone: '0 0 0 1px var(--color-bg-card), 0 20px 60px rgba(0,0,0,0.5)',
        glow: '0 0 12px rgba(59,130,246,0.4)',
        'glow-green': '0 0 12px rgba(16,185,129,0.4)',
        'glow-amber': '0 0 12px rgba(245,158,11,0.4)',
        'glow-red': '0 0 12px rgba(239,68,68,0.4)',
      },
      animation: {
        'wave-bar': 'wave 1.2s ease-in-out infinite',
        'pulse-dot': 'pulse 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
