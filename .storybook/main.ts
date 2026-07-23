import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { motionSaveEndpointPlugin } from '3b1bd3/storybook';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // Deliberately scoped to src/viz — src/stories/ holds slideshow spec data, not CSF stories.
  stories: ['../src/viz/**/*.stories.tsx', '../src/morewrong/**/*.stories.tsx'],
  addons: [fileURLToPath(new URL('./motion-addon/preset.ts', import.meta.url))],
  viteFinal: async (cfg) => {
    // Dev-server endpoint the Motion addon's "save to source" button hits:
    // writes a scene's timing edits into its colocated overrides.json
    // (path-allowlisted to src/viz/**/overrides.json; dev server only).
    cfg.plugins = [
      ...(cfg.plugins ?? []),
      motionSaveEndpointPlugin({
        root: fileURLToPath(new URL('..', import.meta.url)),
        allow: ['src/viz/'],
      }),
    ];
    return cfg;
  },
};

export default config;
