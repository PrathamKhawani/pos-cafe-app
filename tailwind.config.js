/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary: Warm Brown (cafe espresso)
        primary: {
          DEFAULT: '#7C5C3E',
          50:  '#FAF5EF',
          100: '#F2E8D9',
          200: '#E2CDB0',
          300: '#C9A87D',
          400: '#A67C52',
          500: '#7C5C3E',
          600: '#634A31',
          700: '#4D3925',
          800: '#38291A',
          900: '#2C1F13',
        },
        // Espresso: Dark sidebar brown
        espresso: {
          DEFAULT: '#1C0F08',
          50:  '#3D2214',
          100: '#2E1810',
          200: '#1C0F08',
          300: '#150B05',
        },
        // Cream: Light backgrounds
        cream: {
          DEFAULT: '#FAFAF8',
          50:  '#FFFFFF',
          100: '#FAFAF8',
          200: '#F5F2ED',
          300: '#EDE8E0',
          400: '#E2DAD0',
          500: '#D4C9B8',
        },
        // Caramel: Warm accent
        caramel: {
          DEFAULT: '#C8883A',
          400: '#D4974E',
          500: '#C8883A',
          600: '#B07730',
        },
        // Semantic  
        success: { DEFAULT: '#2D7A4F', light: '#EBF7F1' },
        danger:  { DEFAULT: '#C0392B', light: '#FDECEA' },
        warning: { DEFAULT: '#D4870A', light: '#FEF6E4' },
        info:    { DEFAULT: '#2563EB', light: '#EFF4FF' },
        // Neutral grays (warm-tinted)
        neutral: {
          50:  '#FAFAF9',
          100: '#F5F4F2',
          200: '#ECEAE6',
          300: '#D8D5CF',
          400: '#B8B3AA',
          500: '#908A7F',
          600: '#6B6459',
          700: '#4F4840',
          800: '#332D28',
          900: '#1A1510',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
        'primary': '0 4px 12px rgba(124,92,62,0.25)',
        'primary-lg': '0 6px 20px rgba(124,92,62,0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease both',
        'slide-up': 'slideUp 0.25s ease both',
        'slide-in': 'slideIn 0.25s ease both',
        'scale-in': 'scaleIn 0.2s ease both',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
