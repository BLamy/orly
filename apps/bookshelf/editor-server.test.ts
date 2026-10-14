// Unit tests for the Film Editor dev server's pure parts (node --test, erasable TS): project validation,
// the WAV header probe, upload receiving (raw + multipart split at awkward chunk boundaries) and file naming.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { hostName, isAllowedHost, receiveUpload, safeName, validateProject, wavHeaderInfo } from './editor-server.ts';

const now = '2026-10-08T00:00:00.000Z';
function project(): Record<string, unknown> {
  return {
    version: 1,
    slug: 'demo',
    title: 'Demo',
    fps: 24,
    width: 1920,
    height: 1080,
    sampleRate: 48000,
    media: {
      s1: { id: 's1', kind: 'shot', label: 'ch01-s01', duration: 9, film: 'demo', shotId: 'ch01-s01' },
      a1: { id: 'a1', kind: 'audio', label: 'L0101', duration: 2.3, url: '/__editor/media/demo/narration/clips/L0101.wav', role: 'narration' },
      // JSON-encoded Infinity arrives as null
      i1: { id: 'i1', kind: 'image', label: 'still', duration: null, url: '/x.png', width: 10, height: 10 },
    },
    tracks: [
      {
        id: 'V1',
        kind: 'video',
        name: 'Picture',
        mute: false,
        solo: false,
        lock: false,
        height: 64,
        events: [{ id: 'e1', mediaId: 's1', start: 0, length: 9, srcIn: 0, rate: 1, fadeIn: { len: 0, curve: 'linear' }, fadeOut: { len: 0, curve: 'smooth' } }],
      },
      {
        id: 'A1',
        kind: 'audio',
        name: 'Narration',
        mute: false,
        solo: false,
        lock: false,
        height: 48,
        events: [{ id: 'e2', mediaId: 'a1', start: 3.38, length: 2.3, srcIn: 0, rate: 1, fadeIn: { len: 0.01, curve: 'linear' }, fadeOut: { len: 0.01, curve: 'linear' } }],
      },
    ],
    markers: [{ id: 'm1', t: 4.9, label: 'wonder' }],
    regions: [{ id: 'r1', start: 0, end: 75.5, label: 'Chapter 1' }],
    master: { gainDb: 0, limiterDb: -1, finish: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

test('validateProject accepts a well-formed project (null durations = Infinity)', () => {
  assert.deepEqual(validateProject(project(), 'demo'), []);
});

test('validateProject reports structural problems', () => {
  const p = project();
  p.slug = 'other';
  p.fps = 0;
  const tracks = p.tracks as { events: Record<string, unknown>[] }[];
  tracks[0].events[0].length = 0;
  tracks[1].events[0].mediaId = 'missing';
  tracks[1].events[0].id = 'e1'; // duplicate id
  const errs = validateProject(p, 'demo');
  assert.ok(errs.some((e) => e.includes('slug')));
  assert.ok(errs.some((e) => e.includes('fps')));
  assert.ok(errs.some((e) => e.includes('length must be > 0')));
  assert.ok(errs.some((e) => e.includes('not in the media pool')));
  assert.ok(errs.some((e) => e.includes('duplicate id')));
  assert.deepEqual(validateProject([], 'demo'), ['project is not an object']);
});

function wav(frames: number, channels: number, sampleRate: number, dataSizeField?: number): Buffer {
  const bytes = frames * channels * 2;
  const b = Buffer.alloc(44 + bytes);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + bytes, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(channels, 22);
  b.writeUInt32LE(sampleRate, 24);
  b.writeUInt32LE(sampleRate * channels * 2, 28);
  b.writeUInt16LE(channels * 2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(dataSizeField ?? bytes, 40);
  return b;
}

test('wavHeaderInfo reads duration, rate and channels; streamed (0xffffffff) data sizes use the file length', () => {
  const b = wav(48000, 2, 48000);
  assert.deepEqual(wavHeaderInfo(b, b.length), { duration: 1, hasAudio: true, hasVideo: false, still: false, sampleRate: 48000, channels: 2 });
  const s = wav(24000, 1, 48000, 0xffffffff);
  assert.equal(wavHeaderInfo(s, s.length)?.duration, 0.5);
  assert.equal(wavHeaderInfo(Buffer.from('not a wav at all'), 16), null);
});

function request(chunks: Buffer[], headers: Record<string, string>): IncomingMessage {
  return Object.assign(Readable.from(chunks), { headers }) as unknown as IncomingMessage;
}
const tmp = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'editor-server-')), 'upload');

test('receiveUpload streams a raw body', async () => {
  const f = tmp();
  const body = Buffer.from('hello raw upload');
  const r = await receiveUpload(request([body.subarray(0, 5), body.subarray(5)], { 'content-type': 'application/octet-stream' }), f, 1 << 20);
  assert.equal(r.bytes, body.length);
  assert.equal(r.filename, null);
  assert.deepEqual(fs.readFileSync(f), body);
});

test('receiveUpload extracts the first file part of multipart/form-data at any chunking', async () => {
  const boundary = '----orlyBoundary7MA4YWxkTrZu0gW';
  // payload deliberately contains CRLFs and a near-miss of the delimiter
  const payload = Buffer.concat([Buffer.from('RIFF\r\n--'), Buffer.from(`\r\n--${boundary.slice(0, -1)}X`), crypto.getRandomValues(new Uint8Array(3000))]);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="note"\r\n\r\nignored field\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Room Tone (take 2).wav"\r\nContent-Type: audio/wav\r\n\r\n`),
    payload,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  for (const size of [1, 7, 64, 1000, body.length]) {
    const chunks: Buffer[] = [];
    for (let i = 0; i < body.length; i += size) chunks.push(body.subarray(i, i + size));
    const f = tmp();
    const r = await receiveUpload(request(chunks, { 'content-type': `multipart/form-data; boundary=${boundary}` }), f, 1 << 20);
    assert.equal(r.filename, 'Room Tone (take 2).wav', `chunk ${size}`);
    assert.deepEqual(fs.readFileSync(f), payload, `chunk ${size}`);
  }
});

test('receiveUpload enforces the size limit and rejects empty bodies', async () => {
  await assert.rejects(receiveUpload(request([Buffer.alloc(2048)], {}), tmp(), 1024), /exceeds/);
  await assert.rejects(receiveUpload(request([], {}), tmp(), 1024), /empty upload/);
});

test('safeName keeps a readable, path-free name', () => {
  assert.equal(safeName('Room Tone (take 2).WAV'), 'Room-Tone-take-2.wav');
  assert.equal(safeName('../../etc/passwd'), 'passwd');
  assert.equal(safeName('C:\\Users\\me\\clip.mp4'), 'clip.mp4');
  assert.equal(safeName('.hidden.png'), 'hidden.png');
});

test('host check: loopback, IP literals and localhost pass; other names need allowedHosts (DNS rebinding)', () => {
  assert.equal(hostName('Example.com:5199'), 'example.com');
  assert.equal(hostName('[::1]:5199'), '::1');
  assert.equal(hostName('127.0.0.1'), '127.0.0.1');
  for (const h of ['127.0.0.1:5199', 'localhost:5199', 'LOCALHOST', 'app.localhost:5173', '[::1]:5199', '192.168.1.20:5199']) assert.ok(isAllowedHost(h, undefined), h);
  for (const h of ['evil.com:5199', 'localhost.evil.com', '127.0.0.1.nip.io:5199', '', undefined]) assert.ok(!isAllowedHost(h, undefined), String(h));
  assert.ok(isAllowedHost('studio.example.com:5199', ['studio.example.com']));
  assert.ok(isAllowedHost('a.example.com', ['.example.com']));
  assert.ok(isAllowedHost('example.com', ['.example.com']));
  assert.ok(!isAllowedHost('badexample.com', ['.example.com']));
  assert.ok(isAllowedHost('anything.test', true));
});
