import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system — warm neutral base, teal accent
        canvas: "#FAFAF8",
        surface: "#FFFFFF",
        border: {
          DEFAULT: "#E5E1D8",
          subtle: "#F0EDE8",
        },
        ink: {
          DEFAULT: "#1C1917",
          secondary: "#57534E",
          tertiary: "#A8A29E",
        },
        accent: {
          DEFAULT: "#0D7377",
          hover: "#085E62",
          light: "#E0F4F4",
          muted: "#5BADAE",
        },
        success: { DEFAULT: "#16A34A", light: "#DCFCE7" },
        warning: { DEFAULT: "#D97706", light: "#FEF3C7" },
        danger: { DEFAULT: "#DC2626", light: "#FEE2E2" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        serif: ["var(--font-lora)", ...fontFamily.serif],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        elevated: "0 8px 24px 0 rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200px 0" },
          to: { backgroundPosition: "calc(200px + 100%) 0" },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
