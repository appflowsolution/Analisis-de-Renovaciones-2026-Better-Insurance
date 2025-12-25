/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bi-primary': '#17B9B9',      // Turquoise - Better Insurance primary
                'bi-secondary': '#0A4D68',    // Dark blue - Secondary
                'bi-accent': '#14919B',       // Darker turquoise - Accent
                'bi-light': '#A0E7E5',        // Light turquoise
                'bi-dark': '#064663',         // Very dark blue
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
