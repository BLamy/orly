// Re-apply the layered layout + Noun Project icons to an existing book's
// manifest, in place (no re-narration). Usage: node generator/enhance-book.mjs <slug>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { relayout } from './validate.mjs';
import { applyIcons } from './iconize.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(join(ROOT, '.env')); } catch {}

const slug = process.argv[2];
if (!slug) { console.error('usage: node generator/enhance-book.mjs <slug>'); process.exit(1); }
const path = join(ROOT, 'public', 'generated', slug, 'manifest.json');
const m = JSON.parse(readFileSync(path, 'utf8'));
const cache = new Map();
const credits = new Set();
for (const ch of m.chapters) {
  relayout(ch.story);
  const a = await applyIcons(ch.story, cache);
  a.forEach((x) => credits.add(x));
  process.stderr.write(`  ch${ch.number} "${ch.title}": ${ch.story.nodes.length} nodes laid out + iconified\n`);
}
m.iconCredits = [...credits];
writeFileSync(path, JSON.stringify(m, null, 2));
console.log(`enhanced ${slug}: ${m.chapters.length} chapters, ${credits.size} icon credits, ${(readFileSync(path).length / 1024).toFixed(0)}KB`);
