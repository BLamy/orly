// O'RLY parody cover SEEDS: download the sources, keep only the genuine PARODY
// covers (drop any that show the REAL "O'Reilly" publisher) via an OpenAI
// vision check, and pick a random clean one to seed cover-art generation.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEEDS = join(HERE, 'seeds');
const RAW = join(SEEDS, 'raw');
const CLEAN = join(SEEDS, 'clean');
const USABLE = /\.(jpe?g|png|webp)$/i;

export async function vision(imageUrl, prompt, apiKey = process.env.OPENAI_API_KEY) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 10,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } }] }],
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`vision ${r.status}: ${JSON.stringify(j).slice(0, 150)}`);
  return (j.choices?.[0]?.message?.content || '').trim().toUpperCase();
}

const PARODY_PROMPT =
  'Look at this book cover. Does it show the REAL publisher branding text "O\'Reilly" (the actual O\'Reilly Media company name), or is it a PARODY that says "O\'RLY" / "O RLY" / other joke text in the top-left logo position? Answer exactly one word: REAL or PARODY.';

// Download every source URL, vision-filter to parody-only, write clean/ + a manifest.
export async function setupSeeds({ apiKey = process.env.OPENAI_API_KEY, log = () => {} } = {}) {
  if (!apiKey) throw new Error('OPENAI_API_KEY required to filter seeds');
  mkdirSync(RAW, { recursive: true });
  mkdirSync(CLEAN, { recursive: true });
  const { urls } = JSON.parse(readFileSync(join(SEEDS, 'sources.json'), 'utf8'));
  const manifest = [];
  let i = 0;
  for (const url of urls) {
    i++;
    try {
      const res = await fetch(url);
      if (!res.ok) { log(`  ${i}/${urls.length} skip HTTP ${res.status}`); continue; }
      const ct = (res.headers.get('content-type') || '').split(';')[0];
      if (!/^image\//.test(ct)) { log(`  ${i} skip non-image`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 2000 || buf.length > 5_000_000) { log(`  ${i} skip size`); continue; }
      let ext = (extname(new URL(url).pathname) || '.jpg').toLowerCase();
      if (!USABLE.test(ext)) ext = '.jpg';
      const file = `seed-${i}${ext}`;
      writeFileSync(join(RAW, file), buf);
      const verdict = await vision(`data:${ct};base64,${buf.toString('base64')}`, PARODY_PROMPT, apiKey);
      const kept = verdict === 'PARODY' && USABLE.test(file);
      if (kept) writeFileSync(join(CLEAN, file), buf);
      manifest.push({ file, url, verdict, kept });
      log(`  ${i}/${urls.length} ${verdict.padEnd(7)} ${kept ? 'KEEP' : 'drop'} ${file}`);
    } catch (e) {
      log(`  ${i} error ${e.message}`);
    }
  }
  writeFileSync(join(SEEDS, 'manifest.json'), JSON.stringify({ seeds: manifest }, null, 2));
  return manifest;
}

export function randomCleanSeed() {
  if (!existsSync(CLEAN)) return null;
  const files = readdirSync(CLEAN).filter((f) => USABLE.test(f));
  if (!files.length) return null;
  const f = files[Math.floor(Math.random() * files.length)];
  return { file: f, buf: readFileSync(join(CLEAN, f)) };
}
