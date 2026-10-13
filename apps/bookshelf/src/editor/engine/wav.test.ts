// node --test apps/bookshelf/src/editor/engine/wav.test.ts
// WAV encode/parse round trips, header fields, clipping, dither determinism, base64 chunking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { base64ToBytes, bytesToBase64, encodePcm, encodeWav, parseWav, pcm16Base64, pcm16FromBase64, type WavFormat } from './wav.ts';

const sine = (n: number, f: number, sr: number, amp = 0.8): Float32Array => Float32Array.from({ length: n }, (_, i) => amp * Math.sin((2 * Math.PI * f * i) / sr));

test('round trip within one LSB for every format, mono and stereo', () => {
  const sr = 48000;
  const l = sine(4801, 440, sr);
  const r = sine(4801, 660, sr, -0.5);
  const lsb: Record<WavFormat, number> = { pcm16: 1 / 32767, pcm24: 1 / 8388607, float32: 0 };
  for (const fmt of ['pcm16', 'pcm24', 'float32'] as WavFormat[]) {
    for (const chans of [[l], [l, r]]) {
      const wav = encodeWav(chans, sr, fmt);
      const back = parseWav(wav);
      assert.equal(back.sampleRate, sr);
      assert.equal(back.format, fmt);
      assert.equal(back.channels.length, chans.length);
      for (let c = 0; c < chans.length; c++) {
        assert.equal(back.channels[c].length, chans[c].length);
        for (let i = 0; i < chans[c].length; i++) assert.ok(Math.abs(back.channels[c][i] - chans[c][i]) <= lsb[fmt] / 2 + 1e-7, `${fmt} ch${c} @${i}`);
      }
    }
  }
});

test('RIFF header fields (16-bit stereo PCM is the canonical 44-byte header)', () => {
  const wav = encodeWav([new Float32Array(10), new Float32Array(10)], 44100, 'pcm16');
  const v = new DataView(wav.buffer);
  const str = (o: number): string => String.fromCharCode(...wav.subarray(o, o + 4));
  assert.equal(str(0), 'RIFF');
  assert.equal(v.getUint32(4, true), wav.length - 8);
  assert.equal(str(8), 'WAVE');
  assert.equal(str(12), 'fmt ');
  assert.equal(v.getUint16(20, true), 1);
  assert.equal(v.getUint16(22, true), 2);
  assert.equal(v.getUint32(24, true), 44100);
  assert.equal(v.getUint32(28, true), 44100 * 4);
  assert.equal(v.getUint16(32, true), 4);
  assert.equal(v.getUint16(34, true), 16);
  assert.equal(str(36), 'data');
  assert.equal(v.getUint32(40, true), 40);
  assert.equal(wav.length, 44 + 40);
  // 24-bit uses WAVE_FORMAT_EXTENSIBLE; float uses format 3 with a fact chunk
  assert.equal(new DataView(encodeWav([new Float32Array(3)], 48000, 'pcm24').buffer).getUint16(20, true), 0xfffe);
  const f = encodeWav([new Float32Array(3)], 48000, 'float32');
  assert.equal(new DataView(f.buffer).getUint16(20, true), 3);
  assert.equal(String.fromCharCode(...f.subarray(38, 42)), 'fact');
  // odd data length is padded to an even chunk
  assert.equal(encodeWav([new Float32Array(3)], 48000, 'pcm24').length % 2, 0);
});

test('integer formats clip to full scale symmetrically and map NaN to 0', () => {
  const pcm = encodePcm([Float32Array.from([2, -2, 1, -1, Number.NaN, 0.5])], 'pcm16');
  const v = new DataView(pcm.buffer);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((i) => v.getInt16(i * 2, true)), [32767, -32767, 32767, -32767, 0, 16384]);
  const p24 = parseWav(encodeWav([Float32Array.from([5, -5])], 48000, 'pcm24')).channels[0];
  assert.deepEqual([...p24], [1, -1]);
});

test('channel length mismatch is an error', () => {
  assert.throws(() => encodeWav([new Float32Array(3), new Float32Array(4)], 48000));
  assert.throws(() => encodeWav([], 48000));
  assert.throws(() => parseWav(new Uint8Array(20)));
});

test('dither is seeded: identical output for the same seed, different for another, within ±1 LSB', () => {
  const x = sine(1000, 100, 48000, 0.001);
  const a = encodePcm([x], 'pcm16', { dither: true, seed: 7 });
  const b = encodePcm([x], 'pcm16', { dither: true, seed: 7 });
  const c = encodePcm([x], 'pcm16', { dither: true, seed: 8 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  const plain = encodePcm([x], 'pcm16');
  const va = new DataView(a.buffer);
  const vp = new DataView(plain.buffer);
  for (let i = 0; i < 1000; i++) assert.ok(Math.abs(va.getInt16(i * 2, true) - vp.getInt16(i * 2, true)) <= 1);
});

test('base64 helpers: chunk boundaries, large buffers, PCM16 payload round trip', () => {
  for (const n of [0, 1, 2, 3, 0x7fff, 0x8000, 0x8001, 100_003]) {
    const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) & 0xff);
    const b64 = bytesToBase64(bytes);
    assert.equal(b64, Buffer.from(bytes).toString('base64'), `n=${n}`);
    assert.deepEqual(base64ToBytes(b64), bytes);
  }
  // 60 s of stereo at 48 kHz (the export chunk size) encodes without a stack overflow
  const l = sine(48000 * 60, 220, 48000);
  const b64 = pcm16Base64([l, l]);
  assert.equal(base64ToBytes(b64).length, 48000 * 60 * 4);
  const back = pcm16FromBase64(pcm16Base64([l.subarray(0, 999), l.subarray(1, 1000)]), 2);
  assert.equal(back[0].length, 999);
  assert.ok(Math.abs(back[1][10] - l[11]) <= 1 / 32767);
});
