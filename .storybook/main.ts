import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
// The engine now lives in-repo (src/viz/engine). main.ts is evaluated in plain
// Node, so we import the save-endpoint Vite plugin from its css-free source
// module directly — importing the '../src/viz/engine/storybook' barrel would
// pull in editor.css and crash Node (ERR_UNKNOWN_FILE_EXTENSION).
import { motionSaveEndpointPlugin } from '../src/viz/engine/storybook/save-endpoint';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // Deliberately scoped to src/viz — src/stories/ holds slideshow spec data, not CSF stories.
  stories: ['../src/viz/**/*.stories.tsx'],
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
