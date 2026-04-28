import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(6% 0.02 260)',
        surface: 'oklch(12% 0.035 260)',
        border: 'oklch(100% 0 0 / 0.12)',
        primary: 'oklch(76% 0.16 215)',
        bluecore: 'oklch(55% 0.22 260)',
        violetcore: 'oklch(72% 0.16 295)',
        success: 'oklch(70% 0.16 160)',
        warning: 'oklch(72% 0.18 55)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        glow: '0 0 60px oklch(76% 0.16 215 / 0.24)'
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' }
        },
        pulseLine: {
          '0%, 100%': { opacity: '0.22' },
          '50%': { opacity: '0.8' }
        }
      },
      animation: {
        scan: 'scan 4s cubic-bezier(0.22,1,0.36,1) infinite',
        pulseLine: 'pulseLine 2.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
