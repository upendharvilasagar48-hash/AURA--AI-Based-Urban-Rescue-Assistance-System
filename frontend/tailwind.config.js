/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          dark: '#ffffff',
          panel: '#ffffff',
          card: '#f8fafc',
          border: '#e2e8f0',
          red: '#dc2626',
          cyan: '#e11d48',
          blue: '#ef4444',
          amber: '#d97706',
          emerald: '#059669'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
