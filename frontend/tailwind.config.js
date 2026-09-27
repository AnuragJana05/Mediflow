/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hospital: {
          darkest: '#080d1a',
          dark: '#0f172a',
          surface: '#182235',
          card: '#1e293b',
          border: '#334155',
          available: '#10b981',
          occupied: '#ef4444',
          cleaning: '#f59e0b',
          reserved: '#0ea5e9',
          maintenance: '#64748b',
          ai: '#8b5cf6',
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#d97706',
          low: '#16a34a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
