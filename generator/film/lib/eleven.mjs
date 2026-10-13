// ElevenLabs text-to-speech with timestamps (the only network call in narration/voice).
//
//   const r = await ttsWithTimestamps({ voiceId, body, format })  -> { audio: Buffer, alignment, requestId, cost }
//   MODELS[model] = { limit, stitch, rate }   rate = credits per input char (measured 2026-10-05)
//   estimateCredits(chars, model)
//   ProviderLimitError — thrown on quota / rate exhaustion so callers stop cleanly with a resume note.
// The API key comes from .env via secret(); it is never logged and is redacted from error text.
import { redact, secret } from './env.mjs';

export const MODELS = {
  eleven_multilingual_v2: { limit: 10000, stitch: true, rate: 0.4375 },
  eleven_v4: { limit: 10000, stitch: true, rate: 0.125 },
  eleven_v3: { limit: 5000, stitch: false, rate: 0.4375 },
  eleven_flash_v2_5: { limit: 40000, stitch: true, rate: 0.25 },
};
export const DEFAULT_MODEL = 'eleven_multilingual_v2';
export const DEFAULT_SETTINGS = { stability: 0.6, similarity_boost: 0.8, style: 0.05, use_speaker_boost: true, speed: 1.0 };
export const DEFAULT_FORMAT = 'mp3_44100_192';

export const estimateCredits = (chars, model) => Math.ceil(chars * (MODELS[model]?.rate ?? 1));

export class ProviderLimitError extends Error {
  constructor(msg, status) {
    super(msg);
    this.name = 'ProviderLimitError';
    this.status = status;
  }
}

export async function ttsWithTimestamps({ voiceId, body, format = DEFAULT_FORMAT, retries = 4 }) {
  if (!/^[A-Za-z0-9]{8,40}$/.test(voiceId || '')) throw new Error(`bad voice id ${JSON.stringify(voiceId)}`);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=${encodeURIComponent(format)}`;
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'xi-api-key': secret('ELEVENLABS_API_KEY'), 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
        continue;
      }
      throw new Error(`ElevenLabs network error: ${redact(e.message)}`);
    }
    if (res.ok) {
      const j = await res.json();
      if (!j.audio_base64 || !j.alignment) throw new Error('ElevenLabs response missing audio or alignment');
      return {
        audio: Buffer.from(j.audio_base64, 'base64'),
        alignment: j.alignment,
        requestId: res.headers.get('request-id'),
        cost: Number(res.headers.get('character-cost') ?? NaN),
      };
    }
    const text = redact((await res.text()).slice(0, 600));
    const quota = /quota|credits|limit_exceeded|insufficient|payment/i.test(text);
    if (res.status === 401 && quota) throw new ProviderLimitError(`ElevenLabs quota exhausted (401): ${text}`, 401);
    if (res.status === 402) throw new ProviderLimitError(`ElevenLabs payment required (402): ${text}`, 402);
    if (res.status === 429 || res.status >= 500) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2500 * 2 ** attempt));
        continue;
      }
      if (res.status === 429) throw new ProviderLimitError(`ElevenLabs rate/concurrency limit (429) after ${retries} retries: ${text}`, 429);
    }
    throw new Error(`ElevenLabs TTS ${res.status}: ${text}`);
  }
}
