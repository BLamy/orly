// Unit tests: the per-shot ledger's mechanical note check (lib/shotledger.mjs) and the cue-note body remapper
// (lib/cuenotes.mjs). Pure, no network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripComments, phraseChecks, runCheck, worse } from './lib/shotledger.mjs';
import { remapBody, cueContext, auditBody } from './lib/cuenotes.mjs';

test('stripComments drops comments, keeps strings (a URL in a string survives)', () => {
  const src = "// '2 great halls'\nconst a = ['55 · 27']; /* BLEU */ const u = 'http://x';";
  const out = stripComments(src);
  assert.ok(!out.includes('2 great halls'));
  assert.ok(!out.includes('BLEU'));
  assert.ok(out.includes("'55 · 27'"));
  assert.ok(out.includes('http://x'));
});

test('phraseChecks reads "grep the file for X and Y to confirm both are gone"', () => {
  assert.deepEqual(phraseChecks("Grep the file for 'BLEU' and '1/7' to confirm both are gone.").absent, ['BLEU', '1/7']);
  assert.deepEqual(phraseChecks("then grep the file for '55 · 27' to confirm it is gone").absent, ['55 · 27']);
});

test('runCheck: a key string only in a comment does not count; \\u escapes and curly quotes match', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'shots', 'x.tsx'), "// 2 great halls of 4,096\nconst L1 = ['55 \\u00b7 27', 'What Computers Can’t Do'];\n");
  const P = { app: { dir } };
  const r = runCheck(P, 'x', { present: ['2 great halls of 4,096', "Can't Do"], absent: ['55 · 27'] });
  assert.deepEqual(r.missing, ['2 great halls of 4,096']);
  assert.deepEqual(r.found, ['55 · 27']);
  assert.equal(r.ok, false);
  assert.equal(worse('fixed', 'partial'), 'partial');
  assert.equal(worse(null, 'fixed'), 'fixed');
});

test('remapBody: anchored times follow their beat; bare spans are stripped', () => {
  const timeline = { shots: [{ id: 's1', start: 100, end: 120, beats: { lastHall: 8.87, every: 2 }, lines: [{ id: 'L1', start: 1, end: 4, words: [{ w: 'every', start: 2, end: 2.3 }] }] }] };
  const cue = { id: 'm1', start: 99, end: 121, shots: ['s1'] };
  const ctx = cueContext(cue, timeline);
  const body = "THE CATHEDRAL 101.20-110.40: the swell ('lastHall' 88.83) and a lift on 'every' 101.10; keep the piano in gaps under 105.56-104.18. lpf 1200, 46.77 s.";
  const r = remapBody(body, ctx);
  assert.match(r.body, /'lastHall' 108\.87/);
  assert.match(r.body, /'every' 102\.00/);
  assert.ok(!/105\.56|104\.18|101\.20/.test(r.body), r.body);
  assert.match(r.body, /lpf 1200, 46\.77 s/);
  const after = auditBody(r.body, ctx);
  assert.equal(after.stale.length + after.bare.length, 0);
});

test('review round 4: removal keys, respellings, and a respelled re-add is caught', async () => {
  const { removalKeys, respellings, runRespellCheck } = await import('./lib/shotledger.mjs');
  assert.deepEqual(removalKeys("Delete the whole right-hand cost block and the 'seventh' beat. Keep the 'attention' header."), ['seventh']);
  assert.deepEqual(removalKeys("Delete the caption 'untrained toy weights: real bindings'; use the small 'ILLUSTRATIVE' tag instead."), ['untrained toy weights: real bindings']);
  const r = respellings('1/7');
  for (const v of ['one-seventh', 'seventh', '1:7']) assert.ok(r.includes(v), v);
  assert.ok(respellings('seventh').includes('1/7'));
  assert.ok(respellings('GNMT', 'the Google Neural Machine Translation (GNMT) system').includes('Google Neural Machine Translation'));
  assert.ok(respellings('5 to 10 years').includes('five to ten years'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'shots', 'x.tsx'), "const seventhBeat = 1; // 1/7\nconst L = ['≈ one-seventh the compute', 'of Gnmt+RL'];\n");
  const hits = runRespellCheck({ app: { dir } }, 'x', [{ key: '1/7', round: 3 }, { key: 'GNMT', round: 4 }, { key: 'BLEU', round: 3 }]);
  assert.deepEqual(hits.map((h) => [h.key, h.as]), [['1/7', 'one-seventh'], ['GNMT', 'GNMT']]);
});

test('review round 5: a missing word key is satisfied by a named clock beat on that word (within one frame)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  const timeline = path.join(dir, 'timeline.json');
  fs.writeFileSync(timeline, JSON.stringify({ fps: 24, shots: [{ id: 'x', start: 0, end: 40, beats: { stamp: 37.929, early: 30 }, lines: [{ id: 'L1', start: 36, end: 38.4, words: [{ w: 'stays', start: 37.57, end: 37.9 }, { w: 'open.', start: 37.929, end: 38.3 }, { w: 'two', start: 1, end: 1.2 }, { w: 'two', start: 5, end: 5.2 }] }] }] }));
  const P = { app: { dir, timeline } };
  fs.writeFileSync(path.join(dir, 'shots', 'x.tsx'), "const s = T.beat('stamp'); const w = T.word('L1', 'stays');\n");
  const r = runCheck(P, 'x', { present: ["'stays'", "'open'", "'gone'"] });
  assert.deepEqual(r.missing, ["'gone'"]);
  assert.deepEqual(r.viaBeat.map((v) => [v.key, v.beat]), [["'open'", 'stamp']]);
  // a beat more than one frame away does not count, and '#n' picks the n-th occurrence
  fs.writeFileSync(path.join(dir, 'shots', 'x.tsx'), "const s = T.beat('early');\n");
  assert.deepEqual(runCheck(P, 'x', { present: ["'open'"] }).missing, ["'open'"]);
  fs.writeFileSync(timeline, JSON.stringify({ fps: 24, shots: [{ id: 'x', start: 0, end: 40, beats: { second: 5.03 }, lines: [{ id: 'L1', start: 0, end: 6, words: [{ w: 'two', start: 1, end: 1.2 }, { w: 'two', start: 5, end: 5.2 }] }] }] }));
  fs.writeFileSync(path.join(dir, 'shots', 'x.tsx'), 'const s = T.beat("second");\n');
  assert.equal(runCheck(P, 'x', { present: ["'two#2'"] }).ok, true);
  assert.equal(runCheck(P, 'x', { present: ["'two#1'"] }).ok, false);
});
