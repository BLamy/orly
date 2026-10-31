import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';

test('narration preserves a longer recording tail and can be retimed again', async () => {
  const scratch = mkdtempSync(join(tmpdir(), 'orly-timing-test-'));
  try {
    const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
    const output = join(scratch, 'timing.mjs');
    await build({
      stdin: {
        contents: `export { Timeline } from './apps/bookshelf/src/viz/engine/core/timeline.ts';
          export { retimeTimelineToNarration } from './apps/bookshelf/src/player/narration-timing.ts';`,
        resolveDir: root,
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: output,
      logLevel: 'silent',
    });
    const { Timeline, retimeTimelineToNarration } = await import(pathToFileURL(output));
    const timeline = new Timeline();
    const reveal = timeline.channel('reveal', 0);
    timeline.caption({ at: 0.5, dur: 2, text: 'First cue.' });
    timeline.caption({ at: 6, dur: 4, text: 'Last cue.' });
    timeline.tween(reveal, 1, { at: 9, dur: 1 });
    timeline.hold(12, 0);

    retimeTimelineToNarration(timeline, [1, 10], 20);
    assert.equal(timeline.duration, 20, 'the recording tail must remain seekable');
    assert.deepEqual(timeline.beats, [1, 10]);
    assert.equal(timeline.sample(19.9).get(reveal), 1);
    const first = timeline.describe();

    retimeTimelineToNarration(timeline, [1, 10], 20);
    assert.equal(timeline.duration, 20);
    assert.deepEqual(timeline.describe(), first, 'a remount must not shift timing again');
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
