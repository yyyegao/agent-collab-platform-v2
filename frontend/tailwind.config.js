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
        warm: {
          50: '#fdfcfb',
          100: '#f9f7f4',
          200: '#f3efe9',
          300: '#ebe4da',
          400: '#ddd3c4',
          500: '#c9bca8',
          600: '#b5a38c',
          700: '#9a866f',
          800: '#7d6d5a',
          900: '#655a4a',
        },
        accent: {
          orange: '#e85d04',
          'orange-light': '#fff3e6',
          violet: '#7c3aed',
          'violet-light': '#f5f3ff',
          teal: '#0d9488',
          'teal-light': '#f0fdfa',
        },
        'accent-orange': '#e85d04',
        'accent-violet': '#7c3aed',
        'accent-teal': '#0d9488',
        txt: {
          primary: '#1c1917',
          secondary: '#57534e',
          muted: '#a8a29e',
          inverse: '#fafaf9',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        'soft': '0 2px 8px rgba(0,0,0,0.04)',
        'modal': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
