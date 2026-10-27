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
        // Smart Split design system
        background: '#F8F7F4',
        card: '#FFFFFF',
        'primary-text': '#20283B',
        accent: {
          DEFAULT: '#8A7AE6',
          50: '#F0EDFF',
          100: '#E1D9FF',
          200: '#C3B4FF',
          300: '#A590FF',
          400: '#8A7AE6',
          500: '#6B59C9',
          600: '#5441A8',
        },
        teal: {
          DEFAULT: '#5AAE9A',
          50: '#EDF7F5',
          100: '#D0EDE8',
          200: '#A1DBD1',
          300: '#72C9BA',
          400: '#5AAE9A',
          500: '#3E8F7D',
        },
        peach: {
          DEFAULT: '#F8E5D8',
          100: '#F8E5D8',
          200: '#F2CCBA',
          300: '#ECB39C',
        },
        'secondary-text': '#777D8B',
        border: '#E8E7EE',
        success: '#27866B',
        warning: '#C58A37',
        error: '#C75D63',
        // Dark theme
        dark: {
          bg: '#13131F',
          card: '#1E1E2E',
          border: '#2E2E42',
          text: '#E8E7F0',
          muted: '#8B8A9E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(32, 40, 59, 0.05)',
        'DEFAULT': '0 2px 8px 0 rgba(32, 40, 59, 0.08)',
        'md': '0 4px 16px 0 rgba(32, 40, 59, 0.10)',
        'lg': '0 8px 32px 0 rgba(32, 40, 59, 0.12)',
        'xl': '0 16px 48px 0 rgba(32, 40, 59, 0.16)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typing': 'typing 1.4s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        typing: {
          '0%': { opacity: '.2' },
          '20%': { opacity: '1' },
          '100%': { opacity: '.2' },
        },
      },
    },
  },
  plugins: [],
}
