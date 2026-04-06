import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Healthcare primary palette (Teal-Blue)
        primary: {
          100: "#e0f2f1",   
          500: "#0f6b7c",   
          600: "#0a525f",   
        },
       
        accent: {
          500: "#2e8b57",   
          600: "#236b43",   
        },
        secondary: {
          500: "#4a90e2",   
          100: "#eaf3fc",
        },
        
        warning: {
          500: "#e6a017",   
        },
        error: {
          500: "#ef4444",
        },
        info: {
          500: "#4a90e2",
        },
        success: {
          500: "#2e8b57",
        },

      
        dark: {
          100: "#000000",
          200: "#0f1117",
          300: "#151821",
          400: "#1e2432",
          500: "#101012",
        },
   
        light: {
          900: "#ffffff",
          850: "#f0fdf4",   
          800: "#f8fafc",
          700: "#e2e8f0",
          500: "#6b7c93",
          400: "#8595a6",
        },
      },

      fontFamily: {
        openSans: ["Open Sans", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        inter: ["var(--font-inter)"],
        ibmPlex: ["var(--font-ibmplex)"],
        spaceGrotesk: ["var(--font-spaceGrotesk)"],
      },

      boxShadow: {
        "light-100":
          "0px 12px 20px rgba(15, 107, 124, 0.04), 0px 6px 12px rgba(15, 107, 124, 0.03), 0px 2px 4px rgba(15, 107, 124, 0.04)",
        "light-200": "10px 10px 20px rgba(100, 116, 139, 0.08)",
        "light-300": "-10px 10px 20px rgba(100, 116, 139, 0.08)",
        "dark-100": "0px 2px 10px rgba(0, 0, 0, 0.2)",
        "dark-200": "0px 5px 20px rgba(0, 0, 0, 0.3)",
      },

      backgroundImage: {
        "auth-dark": "url('/assets/images/auth-dark.png')",
        "auth-light": "url('/assets/images/auth-light.png')",
      },

      screens: {
        xs: "420px",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate, typography],
};

export default config;