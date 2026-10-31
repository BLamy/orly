// node --test generator/film/timeline.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { assembleTimeline, resolveBeat, findWord, toVtt, lineCues, chaptersText, ffmetadata, lineAt, wrap, DEFAULTS } from './lib/timing.mjs';

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

/** A clip whose speech runs from 0.1 s to 0.1 + n·0.4 s, one word per 0.4 s. */
function clip(words, pre = 0.1, post = 0.2) {
  const ws = words.split(' ').map((w, i) => ({ w, start: pre + i * 0.4, end: pre + i * 0.4 + 0.3 }));
  const speechEnd = pre + words.split(' ').length * 0.4 - 0.1;
  return { duration: speechEnd + post, speechStart: pre, speechEnd, words: ws };
}

function script() {
  return {
    slug: 'demo',
    title: 'Demo',
    chapters: [
      {
        id: 'ch01',
        number: 1,
        title: 'One',
        shots: [
          { id: 'title', mood: 'duskRose', lines: [], minDuration: 3, beats: [{ id: 'rise', at: { shotTime: 0.5 } }, { id: 'out', at: { shotTime: -0.5 } }] },
          {
            id: 's1',
            mood: 'candleAmber',
            transitionIn: 'crossfade',
            lines: [
              { id: 'L1', text: 'a machine that could learn' },
              { id: 'L2', text: 'it was called Perceptron', pauseAfter: 1.0 },
              { id: 'L3', text: 'and then nothing' },
            ],
            beats: [
              { id: 'learn', at: { line: 'L1', word: 'learn.' } },
              { id: 'learnEnd', at: { line: 'L1', word: 4, edge: 'end', offset: 0.25 } },
              { id: 'l2', at: { line: 'L2' } },
              { id: 'l3end', at: { line: 'L3', edge: 'end' } },
            ],
          },
        ],
      },
      { id: 'ch02', number: 2, title: 'Two', shots: [{ id: 's2', mood: 'winterBlue', leadIn: 1.2, holdAfter: 2, minDuration: 10, lines: [{ id: 'L4', text: 'winter came' }], beats: [] }] },
    ],
  };
}

const clips = { L1: clip('a machine that could learn'), L2: clip('it was called Perceptron'), L3: clip('and then nothing'), L4: clip('winter came') };

test('lays lines end to end: leadIn · line · pauseAfter · … · holdAfter, frame-rounded', () => {
  const { timeline: t, placements, warnings } = assembleTimeline(script(), clips, { fps: 24 });
  assert.deepEqual(warnings, []);
  const [title, s1, s2] = t.shots;
  // card: minDuration rules
  assert.equal(title.start, 0);
  assert.equal(title.end, 3);
  assert.deepEqual(title.lines, []);
  // s1 starts where the card ends
  assert.equal(s1.start, 3);
  const [l1, l2, l3] = s1.lines;
  close(l1.start, DEFAULTS.leadIn);
  close(l1.end, 0.6 + 1.9); // 5 words: 0.1 .. 2.0 => 1.9 s of speech
  close(l2.start, l1.end + DEFAULTS.pauseAfter);
  close(l3.start, l2.end + 1.0); // explicit pauseAfter
  const computed = l3.end + DEFAULTS.holdAfter;
  assert.ok(s1.end - s1.start >= computed - 1e-9);
  assert.ok(s1.end - s1.start < computed + 1 / 24);
  // every shot boundary is on a frame
  for (const s of t.shots) close((s.start * 24) % 1 === 0 ? 0 : Math.min((s.start * 24) % 1, 1 - ((s.start * 24) % 1)), 0, 0.01);
  // minDuration floor beats computed
  assert.equal(s2.end - s2.start, 10);
  close(s2.lines[0].start, 1.2);
  // placements put clip sample 0 speechStart before the line start (absolute)
  const p1 = placements.find((p) => p.lineId === 'L1');
  close(p1.at, 3 + 0.6 - 0.1);
  // words are shot-local and inside their line
  assert.deepEqual(l1.words.map((w) => w.w), ['a', 'machine', 'that', 'could', 'learn']);
  close(l1.words[0].start, l1.start);
  // chapters
  assert.deepEqual(t.chapters.map((c) => [c.id, c.start, c.end]), [['ch01', 0, s1.end], ['ch02', s1.end, s2.end]]);
  assert.equal(t.duration, s2.end);
  assert.equal(t.fps, 24);
  // transitions
  assert.equal(title.transitionIn, 'fadeBlack');
  assert.equal(s1.transitionIn, 'crossfade');
  assert.equal(s2.transitionIn, 'cut');
  assert.equal(s2.transitionDur, 0);
});

test('beats resolve to shot-local seconds', () => {
  const { timeline: t } = assembleTimeline(script(), clips, { fps: 24 });
  const [title, s1] = t.shots;
  assert.equal(title.beats.rise, 0.5);
  close(title.beats.out, 2.5); // negative shotTime counts back from the end
  const l1 = s1.lines[0];
  close(s1.beats.learn, l1.words[4].start); // punctuation-blind text match
  close(s1.beats.learnEnd, l1.words[4].end + 0.25);
  close(s1.beats.l2, s1.lines[1].start);
  close(s1.beats.l3end, s1.lines[2].end);
});

test('findWord: index, text, prefix; resolveBeat errors are precise', () => {
  const line = { id: 'L', text: "LeCun's nets learned", start: 0, end: 2, words: [{ w: "LeCun's", start: 0, end: 0.5 }, { w: 'nets', start: 0.6, end: 1 }, { w: 'learned', start: 1.1, end: 2 }] };
  assert.equal(findWord(line, 1), 1);
  assert.equal(findWord(line, 'LECUNS'), 0);
  assert.equal(findWord(line, 'learn'), 2); // prefix fallback
  assert.equal(findWord(line, 7), -1);
  assert.throws(() => resolveBeat({ id: 'b', at: { line: 'L', word: 'zebra' } }, [line]), /word "zebra" not found in L/);
  assert.throws(() => resolveBeat({ id: 'b', at: { line: 'X' } }, [line]), /line X is not in this shot/);
  assert.equal(resolveBeat({ id: 'b', at: { line: 'L', word: 'nets', edge: 'end', offset: -0.1 } }, [line]), 0.9);
});

test('missing narration fails loudly; --draft synthesizes timings', () => {
  const partial = { ...clips };
  delete partial.L3;
  assert.throws(() => assembleTimeline(script(), partial, { fps: 24 }), /line L3 \(s1\) has no narration clip/);
  const { timeline, draftLines, placements } = assembleTimeline(script(), partial, { fps: 24, draftWpm: 120 });
  assert.deepEqual(draftLines, ['L3']);
  assert.equal(timeline.draft, true);
  assert.ok(!placements.some((p) => p.lineId === 'L3'));
  assert.equal(timeline.shots[1].lines[2].words.length, 3);
});

test('duplicate ids and over-long transitions are caught', () => {
  const s = script();
  s.chapters[1].shots[0].lines[0].id = 'L1';
  assert.throws(() => assembleTimeline(s, clips, { fps: 24 }), /duplicate line id L1/);
  const s2 = script();
  s2.chapters[0].shots[0].minDuration = 0.5;
  s2.chapters[0].shots[1].transitionIn = 'fadeBlack';
  const { timeline, warnings } = assembleTimeline(s2, clips, { fps: 24 });
  assert.ok(warnings.some((w) => /clamped/.test(w)));
  assert.ok(timeline.shots[1].transitionDur <= timeline.shots[0].end - timeline.shots[0].start);
});

test('subtitles: long lines split by word timing; chapters + ffmetadata', () => {
  const words = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
  const line = { id: 'L', text: `${words.slice(0, 10).join(' ')}. ${words.slice(10).join(' ')}.`, start: 1, end: 9, words: words.map((w, i) => ({ w, start: 1 + i * 0.4, end: 1 + i * 0.4 + 0.3 })) };
  const cues = lineCues(line, 100);
  assert.ok(cues.length >= 2);
  assert.equal(cues[0].start, 101);
  assert.equal(cues[cues.length - 1].end, 109);
  assert.ok(cues.every((c) => c.text.split("\n").length <= 2 && c.text.split("\n").every((r) => r.length <= 46)));
  for (let i = 1; i < cues.length; i++) assert.ok(cues[i].start >= cues[i - 1].start && cues[i - 1].end >= cues[i].start - 1e-9);
  const { timeline } = assembleTimeline(script(), clips, { fps: 24 });
  const vtt = toVtt(timeline);
  assert.match(vtt, /^WEBVTT\n\n1\n00:00:03\.600 --> /);
  assert.equal(chaptersText(timeline).split('\n')[0], '00:00 1. One');
  assert.match(ffmetadata(timeline, 'Demo'), /\[CHAPTER\]\nTIMEBASE=1\/1000\nSTART=0\nEND=\d+\ntitle=1. One/);
  const at = lineAt(timeline, 3 + timeline.shots[1].lines[0].start + 0.2);
  assert.equal(at.line.id, 'L1');
  assert.equal(at.speaking, true);
});

test('subtitle rows: balanced two-row wrap, never three rows in one cue', () => {
  assert.deepEqual(wrap('Short line.'), ['Short line.']);
  const t = 'When it guesses wrong, the motors nudge each dial a little toward the right answer.';
  const rows = wrap('When it guesses wrong, the motors nudge each dial a little toward it.');
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.length <= 46) && Math.abs(rows[0].length - rows[1].length) < 12, rows.join(' | '));
  assert.ok(wrap(t).length === 2 && wrap(t).every((r) => r.length <= 46));
  const words = t.split(' ').map((w, i) => ({ w, start: i * 0.3, end: i * 0.3 + 0.25 }));
  for (const c of lineCues({ id: 'L1', text: t, start: 0, end: 4.5, words })) assert.ok(c.text.split('\n').length <= 2, c.text);
});

test('preGap sets the silence before a line and wins over the previous pauseAfter', () => {
  const sc = script();
  const s1 = sc.chapters[0].shots[1];
  s1.lines[1].preGap = 0.8; // L2: replaces the default 0.45 after L1
  s1.lines[2].preGap = 2.6; // L3: replaces L2's pauseAfter 1.0 (warns)
  const { timeline: t, warnings } = assembleTimeline(sc, clips, { fps: 24 });
  const [l1, l2, l3] = t.shots[1].lines;
  close(l2.start, l1.end + 0.8);
  close(l3.start, l2.end + 2.6);
  assert.ok(warnings.some((w) => /L3: preGap 2.6s overrides L2's pauseAfter 1s/.test(w)));
  // on a shot's first line preGap is ignored (leadIn governs) and says so
  const sc2 = script();
  sc2.chapters[0].shots[1].lines[0].preGap = 3;
  const r2 = assembleTimeline(sc2, clips, { fps: 24 });
  close(r2.timeline.shots[1].lines[0].start, DEFAULTS.leadIn);
  assert.ok(r2.warnings.some((w) => /L1: preGap on the first line/.test(w)));
});
