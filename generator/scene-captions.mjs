// Load a src/viz scene module (.tsx) in Node and extract its narration script.
//
// Scenes are authored for the browser (React + d3 + 3b1bd3), but their
// TIMELINE is pure data: `vizScene()` returns `{ tl }`, and
// `tl.describe().captions` is the ordered narration script — each
// `tl.caption({at, dur, text})` is one spoken line. We bundle the .tsx with
// esbuild (same resolution vite uses: node_modules for '3b1bd3'/'d3',
// relative imports for core/primitives, JSON for overrides.json), import the
// bundle, and read the captions without ever mounting the React renderer.
//
//   const { captions, duration, leadingComment } = await extractScene(tsxPath);
//   captions: [{ id, at, dur, text }]  (sorted by `at`)
//   duration: total timeline seconds
//   leadingComment: first '//' comment line of the file (chapter-title hint)
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const REPO_ROOT = resolve(dirnameOf(import.meta.url), '..');
function dirnameOf(url) {
  return join(new URL(url).pathname, '..');
}

export async function extractScene(tsxPath) {
  const abs = resolve(tsxPath);
  const tmp = mkdtempSync(join(tmpdir(), 'orly-scene-'));
  const outfile = join(tmp, 'scene.mjs');
  try {
    await esbuild.build({
      entryPoints: [abs],
      bundle: true,
      outfile,
      format: 'esm',
      platform: 'node',
      jsx: 'automatic',
      loader: { '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' },
      logLevel: 'silent',
      // bare imports ('react', 'd3', '3b1bd3') resolve against the repo's
      // node_modules even when the scene file lives elsewhere (tests)
      nodePaths: [join(REPO_ROOT, 'node_modules')],
      define: { 'import.meta.env': '{}' },
    });
    const mod = await import(pathToFileURL(outfile).href);
    const build = mod.vizScene ?? mod.buildScene;
    if (typeof build !== 'function') {
      throw new Error(`${tsxPath}: scene module must export vizScene() (or buildScene())`);
    }
    const { tl } = build();
    if (!tl || typeof tl.describe !== 'function') {
      throw new Error(`${tsxPath}: vizScene() must return { tl: Timeline }`);
    }
    const captions = [...tl.describe().captions]
      .sort((a, b) => a.at - b.at)
      .map(({ id, at, dur, text }) => ({ id, at, dur, text }));
    return { captions, duration: tl.duration, leadingComment: leadingCommentOf(abs) };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** First non-empty '//' comment line of the file, stripped — a title hint. */
function leadingCommentOf(path) {
  const src = readFileSync(path, 'utf8');
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('//')) {
      const c = t.replace(/^\/\/+\s*/, '').trim();
      if (c) return c;
      continue;
    }
    break; // first real code line — no leading comment
  }
  return '';
}
