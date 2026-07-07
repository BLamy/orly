// Publish narration for a Motion Studio scene with ElevenLabs.
//
// In EDIT mode the studio narrates captions with the free in-browser voice;
// this script is the PUBLISH step: it takes the caption script exported by
// the studio ("narration ⬇" → <slug>.narration.json), synthesizes one MP3
// with character-level timestamps, and writes per-caption cues so play mode
// can retime the animation to the recorded voice.
//
// Usage:
//   node generator/viz-narrate.mjs --script fourier.narration.json
//     [--voice <elevenlabs-voice-id>] [--out public/viz-audio]
//     [--provider pocket]   local/free TTS via kyutai pocket-tts (or TTS_PROVIDER=pocket)
//
// Output:
//   public/viz-audio/<slug>.mp3        — the narration
//   public/viz-audio/<slug>.cues.json  — { lines: [{id, at}], duration }
//
// Wire it up in the story:
//   <MotionStudio timeline={tl} storageKey="<slug>"
//     audio={{ url: '/viz-audio/<slug>.mp3', cues }} />
//   (import cues from '/viz-audio/<slug>.cues.json' or fetch it)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { synthesizeChapter } from './tts.mjs';

const DEFAULT_VOICE = 'Fahco4VZzobUeiPqni1S';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const scriptPath = arg('script');
if (!scriptPath) {
  console.error('usage: node generator/viz-narrate.mjs --script <slug>.narration.json [--voice id] [--out dir]');
  process.exit(1);
}

const { slug, lines } = JSON.parse(readFileSync(scriptPath, 'utf8'));
if (!slug || !Array.isArray(lines) || lines.length === 0) {
  console.error('script must be {"slug": "...", "lines": [{"id", "at", "text"}, ...]} (export it from the studio)');
  process.exit(1);
}

const voiceId = arg('voice', DEFAULT_VOICE);
const outDir = arg('out', 'public/viz-audio');
mkdirSync(outDir, { recursive: true });

console.log(`narrating "${slug}" — ${lines.length} lines, voice ${voiceId}`);
const { audio, ext, cues, audioEnd, alignedExact } = await synthesizeChapter({
  spokenSegments: lines.map((l) => l.text),
  voiceId,
  provider: arg('provider'),
});

const mp3Path = join(outDir, `${slug}.${ext}`);
const cuesPath = join(outDir, `${slug}.cues.json`);
writeFileSync(mp3Path, audio);
writeFileSync(
  cuesPath,
  JSON.stringify(
    {
      lines: lines.map((l, i) => ({ id: l.id, at: Number(cues[i].toFixed(3)) })),
      duration: Number(audioEnd.toFixed(3)),
    },
    null,
    2,
  ),
);

console.log(`✓ ${mp3Path} (${(audio.length / 1024 / 1024).toFixed(1)} MB, ${audioEnd.toFixed(1)}s${alignedExact ? '' : ', approximate alignment'})`);
console.log(`✓ ${cuesPath}`);
