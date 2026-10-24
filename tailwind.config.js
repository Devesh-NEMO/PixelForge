/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    files: ["app/**/*.{js,ts,jsx,tsx}", "components/**/*.{js,ts,jsx,tsx}"],
    extract: {
      inline: [
        /[\"'`][^`"'`]{3,}[\"'`]/g,
        /class="([^"]*)"/g,
        /class='([^']*)'/g,
      ],
    },
  },
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted-foreground)",
        primary: "var(--primary-indigo)",
        "primary-light": "var(--primary-indigo-light)",
        border: "var(--border-default)",
        card: "var(--card-bg)",
        input: "var(--input-bg)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};