// One-time: download the O'RLY parody cover sources, vision-filter to
// parody-only (drop any showing the real "O'Reilly"), and audit existing
// book covers. Usage: node generator/setup-seeds.mjs
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { setupSeeds } from './seeds.mjs';
import { auditAnimal } from './cover.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(join(ROOT, '.env')); } catch {}
const log = (m) => process.stderr.write(m + '\n');

const manifest = await setupSeeds({ log });
const kept = manifest.filter((s) => s.kept).length;
log(`\nSEEDS: ${kept}/${manifest.length} parody seeds kept`);

log('\nAuditing existing covers for stray text / real publisher:');
for (const slug of ['koa-onion', 'almostnode']) {
  const p = join(ROOT, 'public', 'generated', slug, 'animal.png');
  if (!existsSync(p)) continue;
  try { log(`  ${slug}: ${await auditAnimal(p)}`); } catch (e) { log(`  ${slug}: ${e.message}`); }
}
