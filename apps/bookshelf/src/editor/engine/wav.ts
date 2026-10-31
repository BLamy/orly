/**
 * WAV / PCM helpers for the export path (offline mix → edit-render.mjs) and for tests.
 *
 *   encodeWav([l, r], 48000, 'pcm24')     -> Uint8Array: a complete RIFF/WAVE file
 *   parseWav(bytes)                        -> { sampleRate, format, channels: Float32Array[] }
 *   encodePcm(channels, 'pcm16')           -> interleaved little-endian PCM bytes (no header)
 *   pcm16Base64(channels)                  -> base64 of interleaved PCM16, the `__edit.renderAudio` chunk payload
 *   bytesToBase64(bytes) / base64ToBytes(s) -> chunked base64 (safe for tens of MB; no call-stack blowups)
 *
 * Float → integer conversion clips to [−1, 1] and rounds to nearest, scaling by 2^(bits−1) − 1 (so +1.0 maps to
 * the largest positive code and −1.0 to its negation: symmetric, round-trip stable). Optional TPDF dither is
 * seeded, so an export is reproducible bit for bit. Float WAVs are WAVE_FORMAT_IEEE_FLOAT (format 3) with the
 * fact chunk; PCM above 16 bits or 2 channels uses WAVE_FORMAT_EXTENSIBLE, as the RIFF spec asks.
 *
 * Erasable TypeScript only (node --test runs this file directly); works in browsers and Node (btoa/atob).
 */

export type WavFormat = 'pcm16' | 'pcm24' | 'float32';

export interface EncodeOptions {
  /** TPDF dither of ±1 LSB for integer formats (seeded: deterministic) */
  dither?: boolean;
  /** dither PRNG seed */
  seed?: number;
}

const bytesPerSample = (f: WavFormat): number => (f === 'pcm16' ? 2 : f === 'pcm24' ? 3 : 4);

/** small deterministic PRNG (mulberry32) for dither */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function frameCount(channels: readonly Float32Array[]): number {
  if (channels.length === 0) return 0;
  const n = channels[0].length;
  for (const c of channels) if (c.length !== n) throw new Error(`wav: channel lengths differ (${n} vs ${c.length})`);
  return n;
}

/** interleaved little-endian sample bytes for `channels` (no header) */
export function encodePcm(channels: readonly Float32Array[], format: WavFormat = 'pcm16', opts: EncodeOptions = {}): Uint8Array {
  const n = frameCount(channels);
  const nc = channels.length;
  const bps = bytesPerSample(format);
  const out = new Uint8Array(n * nc * bps);
  const view = new DataView(out.buffer);
  if (format === 'float32') {
    let o = 0;
    for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++, o += 4) view.setFloat32(o, channels[c][i], true);
    return out;
  }
  const max = format === 'pcm16' ? 32767 : 8388607;
  const rnd = opts.dither ? mulberry32(opts.seed ?? 0x5eed) : null;
  let o = 0;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      let x = channels[c][i] * max;
      if (rnd) x += rnd() - rnd(); // triangular, ±1 LSB
      let q = Math.round(x);
      if (!(q <= max)) q = q > max ? max : 0; // also catches NaN
      if (q < -max) q = -max;
      if (format === 'pcm16') view.setInt16(o, q, true);
      else {
        out[o] = q & 0xff;
        out[o + 1] = (q >> 8) & 0xff;
        out[o + 2] = (q >> 16) & 0xff;
      }
      o += bps;
    }
  }
  return out;
}

// KSDATAFORMAT_SUBTYPE_PCM GUID tail (after the 2-byte format tag): 00 00 00 00 10 00 80 00 00 AA 00 38 9B 71
const GUID_TAIL = [0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71];

/** a complete WAV file for `channels` at `sampleRate` */
export function encodeWav(channels: readonly Float32Array[], sampleRate: number, format: WavFormat = 'pcm16', opts: EncodeOptions = {}): Uint8Array {
  if (channels.length < 1) throw new Error('wav: no channels');
  const data = encodePcm(channels, format, opts);
  const nc = channels.length;
  const bps = bytesPerSample(format);
  const isFloat = format === 'float32';
  const extensible = !isFloat && (bps > 2 || nc > 2);
  const fmtLen = extensible ? 40 : isFloat ? 18 : 16;
  const factLen = isFloat ? 12 : 0;
  const pad = data.length & 1;
  const total = 12 + 8 + fmtLen + factLen + 8 + data.length + pad;
  const out = new Uint8Array(total);
  const v = new DataView(out.buffer);
  const str = (o: number, s: string): void => {
    for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i);
  };
  str(0, 'RIFF');
  v.setUint32(4, total - 8, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, fmtLen, true);
  let o = 20;
  v.setUint16(o, extensible ? 0xfffe : isFloat ? 3 : 1, true);
  v.setUint16(o + 2, nc, true);
  v.setUint32(o + 4, sampleRate, true);
  v.setUint32(o + 8, sampleRate * nc * bps, true);
  v.setUint16(o + 12, nc * bps, true);
  v.setUint16(o + 14, bps * 8, true);
  o += 16;
  if (extensible) {
    v.setUint16(o, 22, true); // cbSize
    v.setUint16(o + 2, bps * 8, true); // valid bits
    // channel mask: mono = FC, stereo = FL|FR, otherwise unspecified
    v.setUint32(o + 4, nc === 1 ? 0x4 : nc === 2 ? 0x3 : 0, true);
    v.setUint16(o + 8, 1, true); // subformat: PCM
    out.set(GUID_TAIL, o + 10);
    o += 24;
  } else if (isFloat) {
    v.setUint16(o, 0, true); // cbSize
    o += 2;
  }
  if (isFloat) {
    str(o, 'fact');
    v.setUint32(o + 4, 4, true);
    v.setUint32(o + 8, data.length / (nc * bps), true);
    o += 12;
  }
  str(o, 'data');
  v.setUint32(o + 4, data.length, true);
  out.set(data, o + 8);
  return out;
}

export interface ParsedWav {
  sampleRate: number;
  format: WavFormat;
  channels: Float32Array[];
}

/** parse a PCM16/24/32 or float32 WAV (the formats encodeWav writes, plus plain format-1 32-bit PCM) */
export function parseWav(bytes: Uint8Array): ParsedWav {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (o: number): string => String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
  if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('wav: not a RIFF/WAVE file');
  let o = 12;
  let fmt: { code: number; nc: number; sr: number; bits: number } | null = null;
  let data: { off: number; len: number } | null = null;
  while (o + 8 <= bytes.length) {
    const id = tag(o);
    const len = v.getUint32(o + 4, true);
    const body = o + 8;
    if (id === 'fmt ') {
      let code = v.getUint16(body, true);
      if (code === 0xfffe && len >= 26) code = v.getUint16(body + 24, true);
      fmt = { code, nc: v.getUint16(body + 2, true), sr: v.getUint32(body + 4, true), bits: v.getUint16(body + 14, true) };
    } else if (id === 'data') {
      data = { off: body, len: Math.min(len, bytes.length - body) };
    }
    o = body + len + (len & 1);
  }
  if (!fmt || !data) throw new Error('wav: missing fmt or data chunk');
  const { code, nc, sr, bits } = fmt;
  const bps = bits / 8;
  const n = Math.floor(data.len / (nc * bps));
  const channels = Array.from({ length: nc }, () => new Float32Array(n));
  let format: WavFormat;
  let read: (p: number) => number;
  if (code === 3 && bits === 32) {
    format = 'float32';
    read = (p) => v.getFloat32(p, true);
  } else if (code === 1 && bits === 16) {
    format = 'pcm16';
    read = (p) => v.getInt16(p, true) / 32767;
  } else if (code === 1 && bits === 24) {
    format = 'pcm24';
    read = (p) => (((bytes[p] | (bytes[p + 1] << 8) | (bytes[p + 2] << 16)) << 8) >> 8) / 8388607;
  } else if (code === 1 && bits === 32) {
    format = 'float32';
    read = (p) => v.getInt32(p, true) / 2147483647;
  } else throw new Error(`wav: unsupported format ${code}/${bits}-bit`);
  let p = data.off;
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++, p += bps) channels[c][i] = read(p);
  return { sampleRate: sr, format, channels };
}

// ---------------------------------------------------------------------------
// base64
// ---------------------------------------------------------------------------
const CHUNK = 0x8000;

/** base64 of `bytes`, built in 32 KiB slices (String.fromCharCode.apply on one huge array overflows the stack) */
export function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  // slices are a multiple of 3 bytes so each encodes without padding and the pieces concatenate
  const step = CHUNK - (CHUNK % 3);
  for (let i = 0; i < bytes.length; i += step) {
    const sub = bytes.subarray(i, Math.min(bytes.length, i + step));
    parts.push(btoa(String.fromCharCode.apply(null, sub as unknown as number[])));
  }
  return parts.join('');
}

/** bytes of a base64 string */
export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** base64 of interleaved little-endian PCM16 (the `window.__edit.renderAudio` chunk payload) */
export const pcm16Base64 = (channels: readonly Float32Array[], opts: EncodeOptions = {}): string => bytesToBase64(encodePcm(channels, 'pcm16', opts));

/** decode a base64 PCM16 payload back into `nc` float channels */
export function pcm16FromBase64(b64: string, nc: number): Float32Array[] {
  const bytes = base64ToBytes(b64);
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = Math.floor(bytes.length / (2 * nc));
  const ch = Array.from({ length: nc }, () => new Float32Array(n));
  let p = 0;
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++, p += 2) ch[c][i] = v.getInt16(p, true) / 32767;
  return ch;
}
