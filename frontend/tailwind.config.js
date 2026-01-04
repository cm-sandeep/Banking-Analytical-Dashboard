/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        foreground: "#F8FAFC",
        card: "#151921",
        'card-foreground': "#F8FAFC",
        primary: "#006FCF",
        'primary-foreground': "#FFFFFF",
        secondary: "#FDBF5E",
        'secondary-foreground': "#0B0E14",
        muted: "#1E293B",
        'muted-foreground': "#94A3B8",
        accent: "#1E293B",
        'accent-foreground': "#F8FAFC",
        destructive: "#EF4444",
        'destructive-foreground': "#FFFFFF",
        border: "#2D3748",
        input: "#2D3748",
        ring: "#006FCF",
        success: "#22C55E",
        warning: "#F59E0B",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
