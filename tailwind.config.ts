import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1B4F91",
        "primary-light": "#EAF1FB",
        accent: "#C8102E",
        bg: "#F5F6F8",
        card: "#FFFFFF",
        border: "#E7E9EC",
        text: "#16181C",
        "text-secondary": "#7B8794",
        "text-muted": "#9AA5B1",
        grade: {
          excellent: "#2FAE60",
          "excellent-bg": "#E6F7ED",
          good: "#1B4F91",
          "good-bg": "#EAF1FB",
          fair: "#E8A33D",
          "fair-bg": "#FDF3E3",
          poor: "#C8102E",
          "poor-bg": "#FBE7EA",
          absent: "#9AA5B1",
          "absent-bg": "#EEF0F2",
        },
      },
      borderRadius: {
        card: "16px",
        control: "13px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
