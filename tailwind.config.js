/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: ({ opacityValue }) => opacityValue === undefined ? 'rgb(var(--color-bg))' : `rgba(var(--color-bg), ${opacityValue})`,
                panel: ({ opacityValue }) => opacityValue === undefined ? 'rgba(var(--color-panel), var(--panel-opacity))' : `rgba(var(--color-panel), ${opacityValue})`,
                panelHover: ({ opacityValue }) => opacityValue === undefined ? 'rgba(var(--color-panel-hover), var(--panel-hover-opacity))' : `rgba(var(--color-panel-hover), ${opacityValue})`,
                border: ({ opacityValue }) => opacityValue === undefined ? 'rgba(var(--color-border), var(--border-opacity))' : `rgba(var(--color-border), ${opacityValue})`,
                accent: {
                    blue: '#3b82f6',
                    purple: '#8b5cf6',
                    cyan: '#06b6d4'
                }
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                'neon-glow': 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, rgba(0, 0, 0, 0) 50%)'
            }
        },
    },
    plugins: [],
}
