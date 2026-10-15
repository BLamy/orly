import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSpeed, voiceSettingsFor } from './tts.mjs';

test('validateSpeed accepts 0.7–1.2 and rejects everything else', () => {
  for (const ok of [0.7, 0.95, 1, 1.2]) assert.equal(validateSpeed(ok), ok);
  for (const bad of [0.69, 1.21, 0, NaN, Infinity, '0.9', null]) assert.throws(() => validateSpeed(bad), /speed must be/);
});

test('no speed → no voice settings and no API read', async () => {
  const client = { voices: { settings: { get: () => assert.fail('must not read settings') } } };
  assert.deepEqual(await voiceSettingsFor(client, 'v1', undefined), {});
});

test('speed merges onto the stored voice settings', async () => {
  const stored = { stability: 0.4, similarityBoost: 0.8, style: 0, useSpeakerBoost: true, speed: 1 };
  const client = { voices: { settings: { get: async (id) => (id === 'v1' ? stored : assert.fail('wrong voice')) } } };
  assert.deepEqual(await voiceSettingsFor(client, 'v1', 0.93), { voiceSettings: { ...stored, speed: 0.93 } });
});

test('unreadable stored settings warns once and falls back to a speed-only override', async (t) => {
  const client = { voices: { settings: { get: async () => { throw new Error('401 missing_permissions'); } } } };
  const warn = t.mock.method(console, 'error', () => {});
  assert.deepEqual(await voiceSettingsFor(client, 'v1', 0.9), { voiceSettings: { speed: 0.9 } });
  assert.equal(warn.mock.callCount(), 1);
  assert.match(warn.mock.calls[0].arguments[0], /could not read stored voice settings for v1 \(401 missing_permissions\); sending speed only as a per-request override/);
});

test('an invalid speed still throws before any read', async () => {
  const client = { voices: { settings: { get: () => assert.fail('must not read settings') } } };
  await assert.rejects(voiceSettingsFor(client, 'v1', 2), /speed must be/);
});
