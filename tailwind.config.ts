import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // T-SMART Brand Colors
        primary: {
          DEFAULT: '#7EC242',
          50: '#F0F8E8',
          100: '#E1F1D1',
          200: '#CDE28C',
          300: '#A8D56B',
          400: '#93CD55',
          500: '#7EC242',
          600: '#659B35',
          700: '#4C7924',
          800: '#3D611D',
          900: '#2E4916',
        },
        accent: {
          DEFAULT: '#F29A2E',
          50: '#FEF5E8',
          100: '#FDEBD1',
          200: '#FBD7A3',
          300: '#F9C375',
          400: '#F7AF47',
          500: '#F29A2E',
          600: '#D8841A',
          700: '#A86515',
          800: '#784810',
          900: '#482B0A',
        },
        neutral: {
          DEFAULT: '#1C1C1C',
          50: '#F5F6F7',
          100: '#E8EAEC',
          200: '#D1D5D9',
          300: '#9CA3AB',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
          700: '#1F2937',
          800: '#1C1C1C',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'neumorphism': '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.8)',
        'neumorphism-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.8)',
      },
      borderRadius: {
        'DEFAULT': '12px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
