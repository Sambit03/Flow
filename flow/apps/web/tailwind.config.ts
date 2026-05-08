import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono:  ['IBM Plex Mono', 'monospace'],
        sans:  ['IBM Plex Sans', 'sans-serif'],
      },
      colors: {
        /* Backgrounds */
        'bg-base':     '#080B11',
        'bg-surface':  '#0D1117',
        'bg-elevated': '#161B22',
        'bg-overlay':  '#1C2333',

        /* Borders */
        'border-dim':    '#21262D',
        'border-muted':  '#30363D',
        'border-active': '#388BFD',

        /* Text */
        'text-primary':   '#E6EDF3',
        'text-secondary': '#8B949E',
        'text-muted':     '#484F58',
        'text-link':      '#58A6FF',

        /* Accents */
        'accent-blue':   '#388BFD',
        'accent-green':  '#3FB950',
        'accent-yellow': '#D29922',
        'accent-red':    '#F85149',
        'accent-purple': '#BC8CFF',
        'accent-teal':   '#39D353',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '10px',
        xl: '14px',
      },
      animation: {
        'fade-in':    'fade-in 0.2s ease both',
        'fade-in-up': 'fade-in-up 0.25s ease both',
        'slide-in':   'slide-in-right 0.25s ease both',
        'slide-up':   'slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-blue': 'pulse-ring-blue 1.5s ease-in-out infinite',
        'spin-slow':  'spin 0.7s linear infinite',
        'shimmer':    'shimmer 1.4s infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring-blue': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(56,139,253,0.5)' },
          '50%':       { boxShadow: '0 0 0 6px rgba(56,139,253,0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
