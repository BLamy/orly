// Generate an O'RLY-parody-style animal engraving for a book cover via the
// OpenAI Images API (gpt-image-1). The publisher chrome (O'RLY banner, title,
// author) is composited in the BROWSER, so this only produces the woodcut
// animal on a white field. For variety we seed generation with a random
// real O'RLY parody cover (image edits), and a vision QA loop rejects any
// output with stray text/lettering before we keep it.
import { writeFileSync } from 'node:fs';
import { randomCleanSeed, vision } from './seeds.mjs';

// Varied engraving styles give the shelf variety without seeding (parody-cover
// seeds bleed their lettering into the animal, so seeding is opt-in).
const STYLES = [
  'fine pen-and-ink stipple engraving',
  'detailed cross-hatch woodcut',
  'vintage scratchboard etching',
  'intricate line engraving',
  'classic natural-history woodcut',
];
const pickStyle = () => STYLES[Math.floor(Math.random() * STYLES.length)];
const STYLE_TAIL =
  "natural-history woodcut in the style of a classic O'Reilly book-cover animal, on a plain solid white background, centered, full body, ABSOLUTELY no text, no lettering, no words, no numbers, no logo, no banner, no border, no frame, high-detail black-and-white line art";

const QA_PROMPT =
  'This image should be ONLY a black-and-white woodcut animal on a white background with NO text. Does it contain ANY text, letters, words, numbers, logos, a publisher name, the words "O\'Reilly" or "O\'RLY", a banner, or stray lettering? Answer exactly one word: DIRTY if you see any text/lettering/logo, or CLEAN if it is purely the animal.';

async function genGenerations(prompt, apiKey, size, quality) {
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size, quality, n: 1 }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`images.generations ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data?.[0]?.b64_json;
}

async function genEdits(prompt, seed, apiKey, size, quality) {
  const fd = new FormData();
  fd.append('model', 'gpt-image-1');
  fd.append('prompt', prompt);
  fd.append('size', size);
  fd.append('quality', quality);
  fd.append('n', '1');
  fd.append('image', new Blob([seed.buf], { type: 'image/jpeg' }), seed.file);
  const r = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` }, // let fetch set the multipart boundary
    body: fd,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`images.edits ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
  return j.data?.[0]?.b64_json;
}

async function qaClean(b64, apiKey) {
  try {
    const v = await vision(`data:image/png;base64,${b64}`, QA_PROMPT, apiKey);
    return v === 'CLEAN';
  } catch {
    return true; // fail-open on QA hiccup; the publisher banner is composited, never generated
  }
}

export async function generateAnimal({
  animal,
  topic,
  outPath,
  apiKey = process.env.OPENAI_API_KEY,
  size = '1024x1536',
  quality = 'medium',
  verify = true,
  maxTries = 4,
  seed = false,
  log = () => {},
}) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for cover art');
  const subject = animal
    ? `A ${animal}`
    : `A single distinctive, characterful animal that suits a technical book about ${topic}`;

  let last;
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    const style = pickStyle();
    const prompt = `${subject}, a ${style}, ${STYLE_TAIL}`;
    const useSeed = seed && attempt <= 2 ? randomCleanSeed() : null;
    let b64;
    try {
      if (useSeed) {
        log(`cover try ${attempt} — seeded (${useSeed.file}, ${style})`);
        b64 = await genEdits(
          `Using ONLY the loose engraving style of the reference as inspiration, render ${subject.toLowerCase()}, a ${style}, ${STYLE_TAIL}. Ignore any text, banner, title or layout in the reference — output JUST the animal.`,
          useSeed, apiKey, size, quality,
        );
      } else {
        log(`cover try ${attempt} — ${style}`);
        b64 = await genGenerations(prompt, apiKey, size, quality);
      }
    } catch (e) {
      log(`  gen error: ${e.message}`);
      continue;
    }
    if (!b64) continue;
    last = b64;
    if (!verify) { writeFileSync(outPath, Buffer.from(b64, 'base64')); return { outPath, attempts: attempt }; }
    const clean = await qaClean(b64, apiKey);
    log(`  QA: ${clean ? 'CLEAN' : 'DIRTY (retry)'}`);
    if (clean) { writeFileSync(outPath, Buffer.from(b64, 'base64')); return { outPath, attempts: attempt }; }
  }
  // all tries had text — keep the last (the in-browser O'RLY chrome still owns the publisher line)
  if (last) { writeFileSync(outPath, Buffer.from(last, 'base64')); return { outPath, dirty: true }; }
  throw new Error('cover generation failed');
}

// Vision QA an existing image file (used to audit already-generated covers).
export async function auditAnimal(path, apiKey = process.env.OPENAI_API_KEY) {
  const { readFileSync } = await import('node:fs');
  const b64 = readFileSync(path).toString('base64');
  return (await qaClean(b64, apiKey)) ? 'CLEAN' : 'DIRTY';
}

/**
 * Downscale a full-size cover PNG to the committed WebP thumbnail. The PNG is
 * a multi-MB gpt-image artifact and stays OUT of git (see .gitignore); only
 * the ~tens-of-KB webp ships with the book and renders on the shelf.
 */
export async function thumbnailAnimal(pngPath, webpPath, width = 512) {
  const { default: sharp } = await import('sharp');
  await sharp(pngPath).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(webpPath);
  return webpPath;
}
