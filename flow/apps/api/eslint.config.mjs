import baseConfig from "@repo/eslint-config/base";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-console": ["warn"],
    },
  },
];
