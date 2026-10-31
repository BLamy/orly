// Voice + lexicon config for a film (films/<slug>/voice/voice.json, lexicon.json).
//
//   loadVoice(P)   -> { voiceId, name, model, settings, seed, format, wpm? }  (throws if voice.json is missing)
//   loadLexicon(P) -> compiled lexicon Map (empty when lexicon.json is absent)
//   lineSig(voice, spoken, tts?) -> short hash identifying one synthesized line (staleness checks; tts.speed counts)
//   lineVoice(voice, tts?) -> the voice with a line's tts.speed applied
//   scriptShots(script, { shots, chapter }) -> [{ chapter, shot }] in film order, filtered
import fs from 'node:fs';
import { readJson, sha } from './paths.mjs';
import { compileLexicon } from './text.mjs';
import { DEFAULT_FORMAT, DEFAULT_MODEL, DEFAULT_SETTINGS, MODELS } from './eleven.mjs';

export function loadVoice(P) {
  if (!fs.existsSync(P.voice)) throw new Error(`no voice locked: run \`npm run film:voice -- lock --slug ${P.slug} --voice <id>\` (writes ${P.voice})`);
  const v = readJson(P.voice);
  const voiceId = v.voiceId ?? v.voice_id ?? v.voice;
  if (!voiceId) throw new Error('voice.json: voiceId missing');
  const model = v.model ?? v.model_id ?? DEFAULT_MODEL;
  if (!MODELS[model]) throw new Error(`voice.json: unknown model ${model}`);
  const settings = { ...DEFAULT_SETTINGS, ...(v.settings ?? v.voice_settings ?? {}) };
  const seed = Number.isInteger(v.seed) ? v.seed : Number.parseInt(sha(P.slug, 8), 16) % 4294967295;
  return { voiceId, name: v.name ?? null, model, settings, seed, format: v.format ?? DEFAULT_FORMAT, wpm: v.wpm ?? null };
}

export function loadLexicon(P) {
  return compileLexicon(fs.existsSync(P.lexicon) ? readJson(P.lexicon) : null);
}

/** A line's voice: the film voice with the line's own tts.speed (script line field) applied. */
export const lineVoice = (voice, tts) => (Number.isFinite(tts?.speed) ? { ...voice, settings: { ...voice.settings, speed: tts.speed } } : voice);
/** tts = the script line's tts field: a per-line speed is part of the signature (solo alone is not: it only
 *  changes how the take is requested, and an unchanged line keeps its take) */
export const lineSig = (voice, spoken, tts) => sha({ v: voice.voiceId, m: voice.model, s: lineVoice(voice, tts).settings, seed: voice.seed, f: voice.format, t: spoken }, 12);

export function scriptShots(script, { shots = [], chapter = [] } = {}) {
  const want = new Set(shots);
  const chs = new Set(chapter);
  const out = [];
  for (const ch of script.chapters || [])
    for (const shot of ch.shots || []) {
      if (want.size && !want.has(shot.id)) continue;
      if (chs.size && !chs.has(ch.id) && !chs.has(String(ch.number))) continue;
      out.push({ chapter: ch, shot });
    }
  for (const id of want) if (!out.some((x) => x.shot.id === id)) throw new Error(`shot ${id} is not in script.json`);
  return out;
}
