// Minimal PCM WAV read/write (no dependency). Channels are Float32Arrays in [-1, 1].
//
//   writeWav(file, [mono], 48000, 's24')         -> { clipped }   formats: s16 | s24 | f32
//   const { channels, sampleRate } = readWav(file) // PCM 16/24/32 int or float32; WAVE_FORMAT_EXTENSIBLE ok
//   peakOf(channels) -> linear sample peak
import fs from 'node:fs';
import path from 'node:path';

export function encodeWav(channels, sampleRate, format = 's24') {
  const n = channels[0]?.length ?? 0;
  const nch = channels.length;
  const bps = format === 's16' ? 2 : format === 's24' ? 3 : 4;
  const fmtTag = format === 'f32' ? 3 : 1;
  const dataBytes = n * nch * bps;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(fmtTag, 20);
  buf.writeUInt16LE(nch, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * nch * bps, 28);
  buf.writeUInt16LE(nch * bps, 32);
  buf.writeUInt16LE(bps * 8, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);
  let o = 44;
  let clipped = 0;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nch; c++) {
      let s = channels[c][i];
      if (!Number.isFinite(s)) s = 0;
      if (format === 'f32') {
        buf.writeFloatLE(s, o);
        o += 4;
        continue;
      }
      if (s > 1 || s < -1) {
        clipped++;
        s = s > 1 ? 1 : -1;
      }
      if (format === 's16') {
        buf.writeInt16LE(Math.round(s < 0 ? s * 0x8000 : s * 0x7fff), o);
        o += 2;
      } else {
        buf.writeIntLE(Math.round(s < 0 ? s * 0x800000 : s * 0x7fffff), o, 3);
        o += 3;
      }
    }
  }
  return { buf, clipped };
}

export function writeWav(file, channels, sampleRate, format = 's24') {
  const { buf, clipped } = encodeWav(channels, sampleRate, format);
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, buf);
  return { clipped };
}

export function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`${file}: not a WAV`);
  let o = 12;
  let fmt = null;
  let data = null;
  while (o + 8 <= b.length) {
    const id = b.toString('ascii', o, o + 4);
    let size = b.readUInt32LE(o + 4);
    if (id === 'data' && (size === 0 || size === 0xffffffff || o + 8 + size > b.length)) size = b.length - o - 8;
    if (id === 'fmt ') {
      let tag = b.readUInt16LE(o + 8);
      if (tag === 0xfffe) tag = b.readUInt16LE(o + 8 + 24);
      fmt = { tag, nch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    } else if (id === 'data') data = { start: o + 8, size };
    o += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error(`${file}: missing fmt/data chunk`);
  const { tag, nch, sr, bits } = fmt;
  const bps = bits / 8;
  const n = Math.floor(data.size / (bps * nch));
  const channels = Array.from({ length: nch }, () => new Float32Array(n));
  let p = data.start;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nch; c++) {
      let v;
      if (tag === 3) v = bits === 64 ? b.readDoubleLE(p) : b.readFloatLE(p);
      else if (bits === 16) v = b.readInt16LE(p) / 0x8000;
      else if (bits === 24) v = b.readIntLE(p, 3) / 0x800000;
      else if (bits === 32) v = b.readInt32LE(p) / 0x80000000;
      else if (bits === 8) v = (b[p] - 128) / 128;
      else throw new Error(`${file}: unsupported ${bits}-bit`);
      channels[c][i] = v;
      p += bps;
    }
  }
  return { channels, sampleRate: sr, frames: n, seconds: n / sr };
}

export function peakOf(channels) {
  let p = 0;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) p = Math.max(p, Math.abs(ch[i]));
  return p;
}

export const dbToGain = (db) => 10 ** (db / 20);
export const gainToDb = (g) => 20 * Math.log10(Math.max(g, 1e-12));
