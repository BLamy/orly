// node --test apps/bookshelf/src/editor/state/store.test.ts
// Undo grouping is per GESTURE (store.seal), not per 600 ms timer: a slow slider drag is one step, two quick drags
// are two steps; undo, redo and load end a gesture too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Project } from '../model/types.ts';
import { editor } from './store.ts';

const base = { version: 1, slug: 's', title: 'T', fps: 24, width: 16, height: 16, sampleRate: 48000, media: {}, tracks: [], markers: [], regions: [], master: { gainDb: 0, limiterDb: -1.5, finish: 1 }, createdAt: '', updatedAt: '' } as unknown as Project;
const gain = (db: number) => (p: Project): Project => ({ ...p, master: { ...p.master, gainDb: db } });

test('a drag that pauses stays one undo step until sealed; the next drag is its own step', () => {
  editor.load(base);
  editor.apply('Gain', gain(1), { coalesce: 'gain' });
  editor.apply('Gain', gain(2), { coalesce: 'gain' }); // however long after the first: still the same gesture
  editor.apply('Gain', gain(3), { coalesce: 'gain' });
  editor.seal(); // pointerup
  editor.apply('Gain', gain(4), { coalesce: 'gain' }); // a second drag right away
  editor.seal();
  assert.equal(editor.getState().project?.master.gainDb, 4);
  editor.undo();
  assert.equal(editor.getState().project?.master.gainDb, 3);
  editor.undo();
  assert.equal(editor.getState().project?.master.gainDb, 0);
  assert.equal(editor.getState().canUndo, false);
});

test('undo and redo end a gesture; a different key or an uncoalesced edit starts a new step', () => {
  editor.load(base);
  editor.apply('Gain', gain(1), { coalesce: 'gain' });
  editor.undo();
  editor.redo();
  editor.apply('Gain', gain(2), { coalesce: 'gain' }); // after a redo: not merged into the redone step
  editor.undo();
  assert.equal(editor.getState().project?.master.gainDb, 1);
  editor.apply('Limiter', (p) => ({ ...p, master: { ...p.master, limiterDb: -2 } }), { coalesce: 'lim' });
  editor.apply('Gain', gain(5), { coalesce: 'gain' });
  editor.undo();
  assert.equal(editor.getState().project?.master.limiterDb, -2);
  assert.equal(editor.getState().project?.master.gainDb, 1);
});

test('load can mark a recovered project dirty', () => {
  editor.load(base, null, { dirty: true });
  assert.equal(editor.getState().dirty, true);
  editor.load(base);
  assert.equal(editor.getState().dirty, false);
});
