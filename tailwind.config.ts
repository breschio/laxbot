import type { Config } from "tailwindcss"
// NOTE: Removing incorrect preset import. Shadcn UI is typically configured via theme extensions.
// import { shadcnPreset } from 'tailwindcss/defaultConfig' // REMOVE this line

const config = {
  darkMode: ["class"], // Standard for Shadcn UI
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    
    './apps/web/src/**/*.{ts,tsx}', 
    './apps/web/src/components/**/*.{ts,tsx}',
    './apps/web/src/pages/**/*.{ts,tsx}',

    './packages/ui/src/**/*.{ts,tsx}', 
  ],
  prefix: "", // Standard for Shadcn UI
  // presets: [ // REMOVE this section
  //   shadcnPreset
  // ],
  theme: {
    container: { // Standard Shadcn UI container settings
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      borderColor: theme => ({ // Added as requested
        DEFAULT: theme('colors.gray.200', 'currentColor'),
        // Ensure dark mode compatibility if needed, e.g.:
        // dark: theme('colors.gray.700', 'currentColor'),
      }),
      colors: { // Standard Shadcn UI color variables structure
         // Ensure gray scale is available (Tailwind includes it by default, preset should ensure it too)
         // No need to explicitly list gray-50 to gray-900 unless overriding
        gray: {
          // Add custom gray values for dark mode
          '850': '#1a1d23',
          '875': '#181b21',
          '925': '#141518',
          // Existing gray-950 is #030712 in Tailwind by default
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#f59e0b", // amber-500
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: { // Standard Shadcn UI border radius
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: { // Standard Shadcn UI animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: { // Standard Shadcn UI animations
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")], // Standard Shadcn UI plugin
} satisfies Config

export default config 