import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  async viteFinal(config) {
    config.plugins ??= [];
    config.plugins.push({
      name: 'strip-node-modules-sourcemap',
      transform(code, id) {
        if (id.includes('node_modules')) {
          return { code: code.replace(/\/\/# sourceMappingURL=\S+/g, ''), map: null };
        }
      },
    });
    return config;
  },
};
export default config;