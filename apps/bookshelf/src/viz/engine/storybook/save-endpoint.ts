import type { Plugin } from 'vite';
import { DEFAULT_SAVE_ENDPOINT } from './protocol';

export interface MotionSaveEndpointOptions {
  /** Absolute directory that repo-relative `file` paths resolve against (usually your project root). */
  root: string;
  /**
   * Repo-relative path-prefix allowlist (forward slashes, e.g. `['src/viz/']`).
   * Saves outside every prefix are rejected. Default: `['src/']`.
   */
  allow?: string[];
  /** Required filename suffix. Default: `'overrides.json'`. */
  suffix?: string;
  /** URL to listen on. Default: `DEFAULT_SAVE_ENDPOINT` (`/__motion/save`). */
  endpoint?: string;
}

/**
 * Dev-server endpoint the Motion panel's "save to source" button POSTs to:
 * writes a scene's timing edits into its colocated overrides.json (which the
 * scene imports at build time — the file IS the source of truth, in git).
 *
 * Add it to Storybook's vite config:
 *
 *   // .storybook/main.ts
 *   viteFinal: async (cfg) => {
 *     cfg.plugins = [...(cfg.plugins ?? []),
 *       motionSaveEndpointPlugin({ root: process.cwd(), allow: ['src/viz/'] })];
 *     return cfg;
 *   },
 *
 * Path-restricted (prefix allowlist + suffix + no `..` / absolute paths);
 * dev server only (`apply: 'serve'`). Node built-ins are imported lazily so
 * this module stays importable from browser code that only wants the types.
 */
export function motionSaveEndpointPlugin(opts: MotionSaveEndpointOptions): Plugin {
  const allow = opts.allow ?? ['src/'];
  const suffix = opts.suffix ?? 'overrides.json';
  const endpoint = opts.endpoint ?? DEFAULT_SAVE_ENDPOINT;
  return {
    name: '3b1bd3-motion-save',
    apply: 'serve',
    async configureServer(server) {
      // Indirection keeps the specifiers non-statically-analyzable so browser
      // bundlers (Storybook's esbuild manager build, Vite's import analysis)
      // don't try to resolve Node built-ins; this only runs in the dev server.
      const dynamicImport = (m: string): Promise<any> => import(/* @vite-ignore */ m);
      const { writeFile } = await dynamicImport('node:fs/promises');
      const { resolve } = await dynamicImport('node:path');
      server.middlewares.use(endpoint, (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          res.setHeader('content-type', 'application/json');
          try {
            const { file, overrides } = JSON.parse(body);
            const norm = String(file).replaceAll('\\', '/');
            const allowed =
              !norm.includes('..') &&
              !norm.startsWith('/') &&
              norm.endsWith(suffix) &&
              allow.some((p) => norm.startsWith(p));
            if (!allowed) {
              throw new Error(
                `refusing to write outside ${allow.map((p) => `${p}**/${suffix}`).join(', ')}: ${norm}`,
              );
            }
            await writeFile(resolve(opts.root, norm), `${JSON.stringify(overrides, null, 2)}\n`);
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
          }
        });
      });
    },
  };
}
