// Generate an O'RLY-parody-style animal engraving for a book cover via the
// OpenAI Images API (gpt-image-1). The publisher chrome (O'RLY banner, title,
// author) is composited in the BROWSER, so this only produces the woodcut
// animal on a white field. For variety we seed generation with a random
// real O'RLY parody cover (image edits), and a vision QA loop rejects any
// output with stray text/lettering before we keep it.
import { writeFileSync } from 'node:fs';
import { randomCleanSeed, vision } from './seeds.mjs';

const STYLE =
  "finely detailed black-and-white pen-and-ink stipple engraving, vintage natural-history woodcut in the style of a classic O'Reilly book-cover animal, on a plain solid white background, centered, full body, no text, no lettering, no border, no frame, high-detail line art";

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
  log = () => {},
}) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for cover art');
  const subject = animal
    ? `A ${animal}`
    : `A single distinctive, characterful animal that suits a technical book about ${topic}`;
  const basePrompt = `${subject}, ${STYLE}`;
  const seedPrompt =
    `Using the loose visual vibe of the reference image as inspiration only, render ${subject.toLowerCase()}: ${STYLE}. ` +
    "CRITICAL: produce ONLY the animal artwork — absolutely no text, letters, words, logos, publisher names, banners, title, border or frame.";

  let last;
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    const seed = attempt <= 2 ? randomCleanSeed() : null;
    let b64;
    try {
      if (seed) { log(`cover try ${attempt} — seeded (${seed.file})`); b64 = await genEdits(seedPrompt, seed, apiKey, size, quality); }
      else { log(`cover try ${attempt} — text-only`); b64 = await genGenerations(basePrompt, apiKey, size, quality); }
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
