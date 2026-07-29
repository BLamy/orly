import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
// The engine lives in apps/bookshelf/src/viz/engine. main.ts is evaluated in plain
// Node, so we import the save-endpoint Vite plugin from its css-free source
// module directly — importing the '../apps/bookshelf/src/viz/engine/storybook' barrel would
// pull in editor.css and crash Node (ERR_UNKNOWN_FILE_EXTENSION).
import { motionSaveEndpointPlugin } from '../apps/bookshelf/src/viz/engine/storybook/save-endpoint';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // Deliberately scoped to the bookshelf visualization source.
  stories: ['../apps/bookshelf/src/viz/**/*.stories.tsx'],
  addons: [fileURLToPath(new URL('./motion-addon/preset.ts', import.meta.url))],
  viteFinal: async (cfg) => {
    // Dev-server endpoint the Motion addon's "save to source" button hits:
    // writes a scene's timing edits into its colocated overrides.json
    // (path-allowlisted to apps/bookshelf/src/viz/**/overrides.json; dev server only).
    cfg.plugins = [
      ...(cfg.plugins ?? []),
      motionSaveEndpointPlugin({
        root: fileURLToPath(new URL('..', import.meta.url)),
        allow: ['apps/bookshelf/src/viz/'],
      }),
    ];
    return cfg;
  },
};

export default config;
