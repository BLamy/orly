// ElevenLabs TTS with character timestamps. We concatenate a chapter's step
// `spoken` segments into one script, synthesize once, and read each segment's
// start time directly from the character alignment — exact cues, no STT.
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const SEP = ' ';

/**
 * Normalize a caption for the VOICE only (the on-screen caption is untouched).
 * ElevenLabs audibly mangles some typography — an em-dash can come out as
 * gibberish — so we rewrite it into plain punctuation the voice reads
 * naturally. Applied BEFORE character offsets are computed, so cues stay exact.
 */
export function sanitizeSpoken(text) {
  return String(text)
    .trim()
    // em/en dash and double-hyphen read as a breath: "a — b" → "a, b"
    .replace(/\s*(?:—|–|--)\s*/g, ', ')
    // curly quotes/apostrophes → straight
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    // ellipsis character → three dots
    .replace(/…/g, '...')
    // collapse doubled punctuation the rewrite may create
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1');
}

/** Lowercased alphanumerics only, with a map back to source indices. */
function squash(chars) {
  const out = [];
  const idx = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/[a-z0-9]/i.test(c)) {
      out.push(c.toLowerCase());
      idx.push(i);
    }
  }
  return { s: out.join(''), idx };
}

/**
 * Locate each segment's start inside the alignment the API actually returned,
 * instead of trusting `text.length === alignment.characters.length` (ElevenLabs
 * normalizes some inputs, which used to silently degrade every cue to a
 * proportional guess). We match each segment's first ~24 alphanumeric
 * characters (case-insensitive, punctuation-blind) against the squashed
 * alignment, scanning forward from the previous match — deterministic, cheap,
 * and immune to punctuation/whitespace normalization.
 *
 * Returns { cues, approx } where approx lists the segment indices that could
 * not be matched (their cue is a proportional estimate).
 */
function cuesFromAlignment(segments, alignment) {
  const alChars = alignment.characters;
  const starts = alignment.characterStartTimesSeconds;
  const ends = alignment.characterEndTimesSeconds;
  const audioEnd = ends[alChars.length - 1] ?? 0;
  const { s: hay, idx } = squash(alChars);

  const cues = new Array(segments.length).fill(null);
  const approx = [];
  let from = 0;
  segments.forEach((seg, i) => {
    const needle = squash(String(seg).split('')).s.slice(0, 24);
    if (!needle) {
      approx.push(i);
      return;
    }
    const at = hay.indexOf(needle, from);
    if (at === -1) {
      approx.push(i);
      return;
    }
    cues[i] = starts[idx[at]] ?? 0;
    from = at + needle.length;
  });

  // Fill unmatched cues proportionally between their matched neighbors.
  for (let i = 0; i < cues.length; i++) {
    if (cues[i] !== null) continue;
    let lo = i - 1;
    while (lo >= 0 && cues[lo] === null) lo--;
    let hi = i + 1;
    while (hi < cues.length && cues[hi] === null) hi++;
    const loT = lo >= 0 ? cues[lo] : 0;
    const hiT = hi < cues.length ? cues[hi] : audioEnd;
    const loI = lo >= 0 ? lo : -1;
    const hiI = hi < cues.length ? hi : cues.length;
    cues[i] = loT + ((hiT - loT) * (i - loI)) / (hiI - loI);
  }
  // monotonic guard
  for (let i = 1; i < cues.length; i++) if (cues[i] < cues[i - 1]) cues[i] = cues[i - 1];
  return { cues, approx, audioEnd };
}

export async function synthesizeChapter({
  spokenSegments,
  voiceId,
  apiKey = process.env.ELEVENLABS_API_KEY,
  modelId = 'eleven_multilingual_v2',
  // Joiner between segments. The default single space keeps the historical
  // storyboard behavior; pass '\n\n' (paragraph break) for natural ~0.6s
  // pauses between narration lines (used by the v3 video pipeline).
  sep = SEP,
}) {
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required for TTS');
  const client = new ElevenLabsClient({ apiKey });

  // Sanitize the SPOKEN string only (captions on screen keep their typography),
  // then build the script. Offsets are no longer trusted for timing — cues come
  // from matching each segment against the returned alignment — but we keep the
  // exact-length check as a cheap health signal.
  const spoken = spokenSegments.map(sanitizeSpoken);
  const text = spoken.join(sep);

  const res = await client.textToSpeech.convertWithTimestamps(voiceId, { text, modelId });
  const mp3 = Buffer.from(res.audioBase64, 'base64');
  const al = res.alignment; // maps to the (possibly normalized) input characters
  const alignedExact = al.characters.length === text.length;

  const { cues, approx, audioEnd } = cuesFromAlignment(spoken, al);

  return {
    mp3,
    cues,
    audioEnd,
    alignedExact,
    /** segment indices whose cue is a proportional estimate (should be []) */
    approxSegments: approx,
    scriptLen: text.length,
    alignLen: al.characters.length,
  };
}
