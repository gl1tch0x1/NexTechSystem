const config = {
  plugins: {
    // Tailwind CSS v4 moved the PostCSS plugin to a separate package.
    // Use @tailwindcss/postcss instead of tailwindcss directly.
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;
