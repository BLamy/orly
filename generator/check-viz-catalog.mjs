// Keep generator/viz-catalog.json in sync with the VIZ_SCENES registry in
// apps/bookshelf/src/viz/scenes.ts. The Node-side validator can't import TSX, so it trusts
// the JSON catalog; this check makes that trust safe. It also verifies the
// storyboard prompt's catalog table mentions every scene.
//
//   node generator/check-viz-catalog.mjs   → exit 0 when in sync, 1 otherwise.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

// Book-local scenes ('books/<bookSlug>/<name>', glob-registered from
// apps/bookshelf/src/viz/books/) are NOT catalog scenes — ignore them on both sides.
const isBookLocal = (slug) => slug.startsWith('books/');

const catalog = JSON.parse(readFileSync(join(HERE, 'viz-catalog.json'), 'utf8'));
const catalogSlugs = new Set(catalog.scenes.map((s) => s.slug).filter((s) => !isBookLocal(s)));

const registrySrc = readFileSync(join(ROOT, 'apps', 'bookshelf', 'src', 'viz', 'scenes.ts'), 'utf8');
// Entries look like:  'slug': entry(() => import('./explainers/…')),
const registrySlugs = new Set(
  [...registrySrc.matchAll(/^\s*'([a-z0-9-]+)':\s*entry\(/gm)]
    .map((m) => m[1])
    .filter((s) => !isBookLocal(s))
);

const prompt = readFileSync(join(HERE, 'prompts', 'storyboard.txt'), 'utf8');

let ok = true;
for (const slug of registrySlugs) {
  if (!catalogSlugs.has(slug)) {
    console.error(`MISSING from viz-catalog.json: '${slug}' (registered in apps/bookshelf/src/viz/scenes.ts)`);
    ok = false;
  }
}
for (const slug of catalogSlugs) {
  if (!registrySlugs.has(slug)) {
    console.error(`STALE in viz-catalog.json: '${slug}' (not registered in apps/bookshelf/src/viz/scenes.ts)`);
    ok = false;
  }
  if (!prompt.includes(slug)) {
    console.error(`MISSING from prompts/storyboard.txt catalog table: '${slug}'`);
    ok = false;
  }
}
if (registrySlugs.size === 0) {
  console.error('Could not parse any registry entries out of apps/bookshelf/src/viz/scenes.ts — check the regex.');
  ok = false;
}

if (ok) {
  console.log(`viz catalog in sync: ${catalogSlugs.size} scenes (registry, catalog, prompt).`);
} else {
  process.exitCode = 1;
}
