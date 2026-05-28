import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Enables manual and system dark mode switching
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        tech: {
          900: '#0B1120', // Deepest tech blue
          800: '#111827', // Slate accent
          cyan: '#22d3ee', // Glowing highlight
          indigo: '#6366f1' // Secondary glow
        }
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'var(--foreground)',
            lineHeight: '1.8', // Perfect web alignment for reading
            a: {
              color: '#22d3ee',
              textDecoration: 'none',
              '&:hover': {
                color: '#6366f1',
                textDecoration: 'underline',
              },
            },
            code: {
              color: '#e2e8f0',
              backgroundColor: '#1e293b',
              padding: '0.25rem 0.4rem',
              borderRadius: '0.25rem',
              fontWeight: '600',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;