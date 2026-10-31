// node --test apps/bookshelf/src/editor/engine/limiter.test.ts
// The master limiter kernel (limiter.ts): a true ceiling, transparency below it, and finite memory, which is what
// makes chunked exports join sample-exactly (the property WebAudio's compressor lacked).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLimiterKernel } from './limiter.ts';

const SR = 48000;

/** deterministic test signal: a loud low tone with bursts (sustained limiting) plus noise */
function signal(n: number, amp: number): [Float32Array, Float32Array] {
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  let s = 12345;
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const noise = (s / 0x7fffffff) * 2 - 1;
    const burst = Math.sin((i / SR) * Math.PI * 1.3) > 0.2 ? 1 : 0.3;
    l[i] = amp * burst * (0.8 * Math.sin((2 * Math.PI * 55 * i) / SR) + 0.2 * noise);
    r[i] = amp * burst * (0.8 * Math.sin((2 * Math.PI * 82 * i) / SR + 1) - 0.2 * noise);
  }
  return [l, r];
}

/** run a kernel over [l, r] in blocks of `block` frames */
function run(l: Float32Array, r: Float32Array, ceilingDb: number, block = 128): [Float32Array, Float32Array] {
  const k = createLimiterKernel({ sampleRate: SR, ceilingDb });
  const ol = new Float32Array(l.length);
  const or = new Float32Array(r.length);
  for (let i = 0; i < l.length; i += block) {
    const n = Math.min(block, l.length - i);
    k.process(l.subarray(i, i + n), r.subarray(i, i + n), ol.subarray(i, i + n), or.subarray(i, i + n), n);
  }
  return [ol, or];
}

test('limiter: never exceeds the ceiling, even on a signal 12 dB over it', () => {
  const [l, r] = signal(SR * 3, 4);
  for (const db of [-1.5, -6, 0]) {
    const c = 10 ** (db / 20);
    const [ol, or] = run(l, r, db);
    let peak = 0;
    for (let i = 0; i < ol.length; i++) peak = Math.max(peak, Math.abs(ol[i]), Math.abs(or[i]));
    assert.ok(peak <= c + 1e-7, `${db} dB: peak ${peak} over ${c}`);
    assert.ok(peak > c * 0.95, `${db} dB: limited signal still reaches the ceiling (${peak})`);
  }
});

test('limiter: transparent below the ceiling (a pure delay of `latency` frames)', () => {
  const [l, r] = signal(SR, 0.5);
  const k = createLimiterKernel({ sampleRate: SR, ceilingDb: -1.5 });
  const [ol, or] = run(l, r, -1.5, 97);
  for (let i = k.latency; i < l.length; i++) {
    assert.equal(ol[i], l[i - k.latency]);
    assert.equal(or[i], r[i - k.latency]);
  }
});

test('limiter: finite memory — a chunk rendered with a pre-roll matches the continuous render', () => {
  const [l, r] = signal(SR * 4, 3);
  const [cl, cr] = run(l, r, -1.5, 128);
  const probe = createLimiterKernel({ sampleRate: SR, ceilingDb: -1.5 });
  const lat = probe.latency;
  // a chunk starting at an arbitrary sample, with a pre-roll of exactly the kernel's memory and odd block sizes
  for (const start of [SR + 12345, 2 * SR + 7, 3 * SR - 999]) {
    const pre = probe.memory;
    const from = start - pre;
    const n = Math.min(l.length - from, SR / 2);
    const [ol, or] = run(l.subarray(from, from + n), r.subarray(from, from + n), -1.5, 113);
    // output index j of the chunk is input sample from + j − lat; compare once past the pre-roll
    let worst = 0;
    for (let j = pre + lat; j < n; j++) {
      const i = from + j; // the same output position in the continuous render
      worst = Math.max(worst, Math.abs(ol[j] - cl[i]), Math.abs(or[j] - cr[i]));
    }
    assert.ok(worst < 1e-6, `chunk at ${start}: differs by ${worst}`);
  }
});

test('limiter: the gain moves smoothly (no steps larger than one ramp increment)', () => {
  // a single full-scale impulse in silence: the gain dips to the needed level and recovers linearly
  const n = SR / 2;
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (let i = 0; i < n; i++) l[i] = r[i] = 0.25;
  l[SR / 4] = r[SR / 4] = 2;
  const c = 10 ** (-1.5 / 20);
  const k = createLimiterKernel({ sampleRate: SR, ceilingDb: -1.5 });
  const [ol] = run(l, r, -1.5);
  const g = (j: number) => ol[j] / l[j - k.latency];
  const step = 1 / Math.round(SR * 0.005) + 1e-6;
  for (let j = k.latency + 1; j < n; j++) assert.ok(Math.abs(g(j) - g(j - 1)) <= step + 1e-6, `gain step at ${j}`);
  assert.ok(Math.abs(ol[SR / 4 + k.latency] - c) < 1e-6, 'the peak lands exactly on the ceiling');
});
