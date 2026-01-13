import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Duolingo-inspired colors
                'duo-green': '#58CC02',
                'duo-green-dark': '#4CAF00',
                'duo-green-light': '#7ED321',
                'duo-blue': '#1CB0F6',
                'duo-blue-dark': '#1899D6',
                'duo-purple': '#CE82FF',
                'duo-purple-dark': '#A560D8',
                'duo-orange': '#FF9600',
                'duo-orange-dark': '#E08600',
                'duo-red': '#FF4B4B',
                'duo-red-dark': '#EA2B2B',
                'duo-yellow': '#FFC800',
                'duo-yellow-dark': '#E0B000',
                'duo-pink': '#FF86D0',
                'duo-gray': {
                    50: '#FAFAFA',
                    100: '#F7F7F7',
                    200: '#E5E5E5',
                    300: '#AFAFAF',
                    400: '#777777',
                    500: '#4B4B4B',
                    800: '#3C3C3C',
                    900: '#1A1A1A',
                },
            },
            fontFamily: {
                sans: ['Nunito', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'xl': '16px',
                '2xl': '24px',
            },
            boxShadow: {
                'btn-green': '0 4px 0 #4CAF00',
                'btn-blue': '0 4px 0 #1899D6',
                'btn-purple': '0 4px 0 #A560D8',
                'btn-orange': '0 4px 0 #E08600',
                'btn-gray': '0 4px 0 #E5E5E5',
                'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
            },
            animation: {
                'bounce-once': 'bounce 0.5s ease-in-out',
                'pulse-slow': 'pulse 2s ease-in-out infinite',
                'shake': 'shake 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'glow': 'glow 2s ease-in-out infinite',
            },
            keyframes: {
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-5px)' },
                    '75%': { transform: 'translateX(5px)' },
                },
                slideUp: {
                    from: { transform: 'translateY(20px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                glow: {
                    '0%, 100%': { boxShadow: '0 0 5px #FFC800, 0 0 10px #FFC800' },
                    '50%': { boxShadow: '0 0 20px #FFC800, 0 0 30px #FFC800' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
