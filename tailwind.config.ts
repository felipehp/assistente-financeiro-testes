import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'owl-orange':      '#F5820D',
        'owl-orange-dark': '#D96A00',
        'owl-orange-soft': '#FEF0E0',
        'violet':          '#7C5CBF',
        'violet-dark':     '#614A99',
        'violet-soft':     '#EDE8F8',
        'cream':           '#FFFBF4',
        'cream-card':      '#FFFFFF',
        'ink':             '#1C1A2E',
        'slate-text':      '#5A567A',
        'mist':            '#E4E0F0',
        'error':           '#C0392B',
        'success':         '#1A7F5A',
      },
      borderRadius: {
        'btn':  '12px',
        'card': '16px',
      },
      fontFamily: {
        sans: ['var(--font-atkinson)', 'system-ui', 'sans-serif'],
      },
    },
  },
}

export default config
