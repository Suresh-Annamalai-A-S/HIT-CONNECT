// HIT Connect — Tailwind Theme Configuration
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif']
      },
      colors: {
        crimson: {
          50: '#FDF2F5',
          100: '#FCE4EA',
          200: '#F5C2CF',
          500: '#C4264B',
          600: '#A51D3D',
          700: '#861630',
          800: '#6B1126'
        },
        navy: {
          50: '#F1F5F9',
          100: '#E2E8F0',
          700: '#274266',
          800: '#182C46',
          900: '#101E30'
        },
        gold: {
          50: '#FEF9EB',
          100: '#FCF0CE',
          200: '#F0D78C',
          600: '#D6A43B',
          700: '#9A6F16',
          800: '#78540E'
        }
      }
    }
  }
};
