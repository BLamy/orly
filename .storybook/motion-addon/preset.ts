import { fileURLToPath } from 'node:url';

// Local-addon preset: contributes the Motion panel to the manager build
// (the manager builder compiles the .tsx; this file stays JSX-free because
// presets are evaluated in Node).
export const managerEntries = (entries: string[] = []) => [
  ...entries,
  fileURLToPath(new URL('./manager.tsx', import.meta.url)),
];
