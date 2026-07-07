// Local TTS via kyutai pocket-tts (https://github.com/kyutai-labs/pocket-tts).
// Free, runs on CPU — no ElevenLabs account needed. pocket-tts gives no
// character timestamps, so instead of one long synthesis we synthesize each
// step's `spoken` segment on its own, insert a short silence between segments,
// and derive the cues from the accumulated durations — exact by construction.
//
// The model runs in a small Python helper (pocket_tts_helper.py). It is
// launched, in order of preference, with:
//   1. $POCKET_TTS_PYTHON        e.g. "python3" or ".venv/bin/python"
//   2. uv run --with pocket-tts  (zero-setup if `uv` is installed)
//   3. python3                   (needs `pip install pocket-tts`)
// The first run downloads the model weights from Hugging Face (~a few hundred
// MB, cached afterwards).
//
// Output is MP3 when ffmpeg is on PATH, otherwise WAV (callers name the file
// from the returned `ext`).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HELPER = join(dirname(fileURLToPath(import.meta.url)), 'pocket_tts_helper.py');
const DEFAULT_VOICE = 'alba';
const DEFAULT_GAP_S = 0.45; // silence between steps; ElevenLabs pauses ~this long at a sentence break

// ElevenLabs voice ids are long alphanumeric tokens; pocket voices are short
// names like "alba" or "george". Callers pass whatever --voice they got, so
// route ids that can't be a pocket voice to the local default instead.
function resolveVoice(voiceId) {
  if (process.env.POCKET_TTS_VOICE) return process.env.POCKET_TTS_VOICE;
  if (voiceId && !/^[A-Za-z0-9]{16,}$/.test(voiceId)) return voiceId;
  return DEFAULT_VOICE;
}

function helperCommand() {
  if (process.env.POCKET_TTS_PYTHON) return process.env.POCKET_TTS_PYTHON.split(/\s+/);
  if (spawnSync('uv', ['--version'], { stdio: 'ignore' }).status === 0) {
    return ['uv', 'run', '--with', 'pocket-tts', 'python3'];
  }
  return ['python3'];
}

function runHelper(job, workDir) {
  const jobPath = join(workDir, 'job.json');
  writeFileSync(jobPath, JSON.stringify(job));
  const [cmd, ...pre] = helperCommand();
  const res = spawnSync(cmd, [...pre, HELPER, jobPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'], // helper progress goes to our stderr
    maxBuffer: 16 * 1024 * 1024,
  });
  if (res.error?.code === 'ENOENT') {
    throw new Error(`"${cmd}" not found — install uv (https://docs.astral.sh/uv/) or \`pip install pocket-tts\` and set POCKET_TTS_PYTHON`);
  }
  if (res.status !== 0) {
    throw new Error(`pocket-tts helper failed (exit ${res.status}) — if pocket_tts is missing, run \`pip install pocket-tts\` or install uv`);
  }
  const lastLine = res.stdout.trim().split('\n').filter(Boolean).pop();
  return JSON.parse(lastLine); // { sampleRate, durations }
}

// Minimal RIFF/WAVE wrapper around mono 16-bit PCM.
function wavFromPcm16(pcm, sampleRate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function tryEncodeMp3(pcm, sampleRate) {
  const res = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-i', 'pipe:0',
    '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', 'pipe:1',
  ], { input: pcm, maxBuffer: 512 * 1024 * 1024 });
  if (res.error || res.status !== 0 || !res.stdout?.length) return null;
  return res.stdout;
}

export async function synthesizeChapterPocket({ spokenSegments, voiceId, voice, gapSeconds }) {
  const segments = spokenSegments.map((s) => String(s).trim());
  const voiceName = voice || resolveVoice(voiceId);
  const gap = gapSeconds ?? (Number(process.env.POCKET_TTS_GAP) || DEFAULT_GAP_S);

  const work = mkdtempSync(join(tmpdir(), 'pocket-tts-'));
  try {
    const { sampleRate, durations } = runHelper({ voice: voiceName, segments, outDir: work }, work);
    if (durations.length !== segments.length) {
      throw new Error(`pocket-tts returned ${durations.length} segments, expected ${segments.length}`);
    }

    // Stitch: [seg0][gap][seg1][gap]… — a segment's cue is where it starts.
    const gapPcm = Buffer.alloc(2 * Math.round(gap * sampleRate));
    const chunks = [];
    const cues = [];
    let t = 0;
    segments.forEach((_, i) => {
      if (i > 0) {
        chunks.push(gapPcm);
        t += gapPcm.length / 2 / sampleRate;
      }
      cues.push(t);
      const pcm = readFileSync(join(work, `seg-${i}.pcm`));
      chunks.push(pcm);
      t += pcm.length / 2 / sampleRate;
    });
    const pcmAll = Buffer.concat(chunks);
    const audioEnd = t;

    const mp3 = tryEncodeMp3(pcmAll, sampleRate);
    const audio = mp3 ?? wavFromPcm16(pcmAll, sampleRate);
    if (!mp3) console.error('  (ffmpeg not found — writing WAV; install ffmpeg for smaller MP3 output)');

    const scriptLen = segments.join(' ').length;
    return {
      audio,
      ext: mp3 ? 'mp3' : 'wav',
      mp3: audio, // legacy alias
      cues,
      audioEnd,
      alignedExact: true,
      scriptLen,
      alignLen: scriptLen,
      provider: 'pocket',
      voice: voiceName,
      sampleRate,
    };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
