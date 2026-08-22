/** @type {import('tailwindcss').Config} */

// Tokens are stored as "R G B" channels in styles/tokens.css, so every colour
// is composed with <alpha-value>. Without this, opacity modifiers such as
// ring-primary/40 compile to nothing at all.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token('primary'),
          dark: token('primary-dark'),
          tint: token('primary-tint'),
        },
        'on-primary': token('on-primary'),
        accent: {
          DEFAULT: token('accent'),
          tint: token('accent-tint'),
        },
        brand: token('brand-deep'),
        ink: token('ink'),
        muted: token('muted'),
        soft: token('soft'),
        surface: token('surface'),
        canvas: token('bg'),
        hairline: token('border'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
      },
      fontFamily: {
        display: ['Sora', 'Cambria', 'Georgia', 'serif'],
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.18), 0 1px 3px rgb(0 0 0 / 0.22)',
        lifted: '0 4px 12px rgb(0 0 0 / 0.28), 0 2px 4px rgb(0 0 0 / 0.18)',
      },
    },
  },
  plugins: [],
}
