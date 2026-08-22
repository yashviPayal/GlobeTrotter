/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Every colour resolves to a CSS variable in styles/tokens.css, so dark
      // mode is a token swap rather than a second set of utility classes.
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          tint: 'var(--primary-tint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          tint: 'var(--accent-tint)',
        },
        brand: 'var(--brand-deep)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        soft: 'var(--soft)',
        surface: 'var(--surface)',
        canvas: 'var(--bg)',
        hairline: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
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
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)',
        lifted: '0 4px 12px rgb(15 23 42 / 0.08), 0 2px 4px rgb(15 23 42 / 0.04)',
      },
    },
  },
  plugins: [],
}
