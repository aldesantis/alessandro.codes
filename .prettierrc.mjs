/** @type {import("prettier").Config} */
export default {
  plugins: ["prettier-plugin-astro"],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
    {
      files: "*.{js,jsx,ts,tsx}",
      options: {
        parser: "babel-ts",
      },
    },
    {
      files: "*.json",
      options: {
        parser: "json",
      },
    },
  ],
  printWidth: 120,
  tabWidth: 2,
  semi: true,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  singleQuote: false,
};
