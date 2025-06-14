/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        crypto: {
          gold: '#FFD700',
          'gold-light': '#FFF8DC',
          'gold-dark': '#B8860B',
          dark: '#1a1a2e',
          'dark-light': '#16213e',
          purple: '#6b46c1',
          'purple-light': '#a78bfa',
          blue: '#3b82f6',
          'blue-light': '#93c5fd',
          green: '#10b981',
          'green-light': '#6ee7b7',
          red: '#ef4444',
          'red-light': '#fca5a5',
        },
        lottery: {
          primary: '#FFD700',
          secondary: '#1a1a2e',
          accent: '#6b46c1',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          pool: '#3b82f6',
          reserve: '#9333ea',
        }
      },
      backgroundImage: {
        'crypto-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)',
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'pool-gradient': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'reserve-gradient': 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
        'winner-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'confetti': 'confetti 3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(255, 215, 0, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        confetti: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)' },
        },
      },
      fontFamily: {
        'crypto': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Orbitron', 'monospace'],
      },
      fontSize: {
        'emoji': '2.5rem',
        'emoji-lg': '3.5rem',
        'emoji-xl': '4.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
      },
      borderRadius: {
        'crypto': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      backdropBlur: {
        'crypto': '12px',
      },
      boxShadow: {
        'crypto': '0 25px 50px -12px rgba(255, 215, 0, 0.25)',
        'pool': '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
        'reserve': '0 25px 50px -12px rgba(147, 51, 234, 0.25)',
        'winner': '0 25px 50px -12px rgba(16, 185, 129, 0.25)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 