import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      colors: {
        // Warm near-blacks — page + surfaces (Lune Atelier dark theme)
        ink: {
          DEFAULT: '#0A0A0A',
          950: '#050505',
          900: '#0A0A0A',
          850: '#0F0F0F',
          800: '#141414',
          700: '#1C1C1C',
          600: '#262626',
          500: '#333333',
        },
        // Champagne gold — accents, from the logo
        gold: {
          DEFAULT: '#C8A45C',
          50: '#FBF7EC',
          100: '#F3E9CC',
          200: '#E3D2A6',
          300: '#D6BE80',
          400: '#C8A45C',
          500: '#B98E40',
          600: '#9C7C3C',
          700: '#7E6230',
          800: '#5E4922',
          900: '#3F3017',
        },
        // Warm off-whites — text on dark
        cream: {
          DEFAULT: '#F5F0E6',
          100: '#F5F0E6',
          200: '#E8E2D4',
          muted: '#A39E94',
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [typography],
}

export default config
