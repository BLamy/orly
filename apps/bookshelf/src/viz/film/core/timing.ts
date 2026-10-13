/**
 * Shot timing — anchor animation to the narration (the locked edit).
 *
 *   const T = shotTiming(data)           // data: ShotTimingData from timeline.json
 *   T.duration                           // shot length (s)
 *   T.line('L0003').start / .end         // shot-local seconds
 *   T.word('L0003', 4)                   // start of word 4 (0-based; -1 = last word)
 *   T.word('L0003', 'perceptron')        // first word matching (case/punct/accent-insensitive)
 *   T.word('L0003', 'the#2')             // 2nd occurrence
 *   T.wordEnd('L0003', 'learn')          // end of that word
 *   T.beat('reveal')                     // named script beat (throws if missing) — T.beat('x', 3.0) gives a fallback
 *   T.emphasis()                         // stressed content-word times ≥ 1.2 s apart (gesture beats), deterministic
 *
 *   lineAt(T, t) / wordIndexAt(line, t)  // what is being said at shot-local t (studio, placeholders)
 *
 * All times are SHOT-LOCAL seconds. Word timings in timeline.json are shot-local too
 * (same clock as line.start); line-relative word times are detected and shifted.
 */
import type { LineTiming, ShotTiming, ShotTimingData, WordTiming } from '../contracts';

/** case-, accent- and punctuation-insensitive form of a word */
export function normWord(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

const STOP = new Set(
  (
    'a an the and or but nor so yet for of to in on at by from with into onto upon over under about above below ' +
    'as than then that this these those there here where when what which who whom whose why how ' +
    'is am are was were be been being do does did done have has had having will would shall should can could may might must ' +
    'i me my mine we us our ours you your yours he him his she her hers it its they them their theirs ' +
    'not no yes all any some each every both either neither one ones own same such only just very too also even ' +
    'more most less least much many few other another again ever never still already out up down off back away ' +
    'if because while though although until unless since before after during through across against between among ' +
    'its it\'s thats that\'s dont didnt doesnt isnt wasnt cant wont lets let\'s ' +
    'said says say like way thing things something nothing everything kind sort lot'
  )
    .split(/\s+/)
    .map(normWord),
);

/** Normalize a line's words to shot-local time (detects line-relative timings). */
function fixLine(l: LineTiming): LineTiming {
  const w0 = l.words[0];
  if (w0 && l.start > 0.1 && w0.start < l.start - 0.05) {
    return { ...l, words: l.words.map((w) => ({ ...w, start: w.start + l.start, end: w.end + l.start })) };
  }
  return l;
}

function findWord(line: LineTiming, which: number | string): WordTiming {
  const ws = line.words;
  if (!ws.length) throw new Error(`timing: line ${line.id} has no word timings`);
  if (typeof which === 'number') {
    const i = which < 0 ? ws.length + which : which;
    if (i < 0 || i >= ws.length) throw new Error(`timing: word #${which} out of range in ${line.id} (${ws.length} words)`);
    return ws[Math.floor(i)];
  }
  let text = which;
  let nth = 1;
  const hash = which.lastIndexOf('#');
  if (hash > 0 && /^\d+$/.test(which.slice(hash + 1))) {
    text = which.slice(0, hash);
    nth = Math.max(1, Number(which.slice(hash + 1)));
  }
  const q = normWord(text);
  const norms = ws.map((w) => normWord(w.w));
  for (const test of [(n: string) => n === q, (n: string) => n.startsWith(q), (n: string) => n.includes(q)]) {
    let seen = 0;
    for (let i = 0; i < ws.length; i++) {
      if (test(norms[i]) && ++seen === nth) return ws[i];
    }
  }
  throw new Error(`timing: word "${which}" not found in ${line.id}: "${line.text}"`);
}

function score(w: WordTiming, i: number): number {
  const n = normWord(w.w);
  if (n.length < 3 || STOP.has(n)) return -1;
  let s = Math.min(n.length, 10) * 0.35;
  if (i > 0 && /^\p{Lu}/u.test(w.w.trim())) s += 1.5; // proper noun mid-line
  if (/\p{N}/u.test(n)) s += 1.2; // years, numbers
  if (/[,.;:!?—–-]["'”’)]*$/.test(w.w.trim())) s += 0.8; // phrase-final stress
  s += Math.min(Math.max(w.end - w.start, 0), 0.6) * 2; // drawn-out words
  return s;
}

export function shotTiming(data: ShotTimingData): ShotTiming {
  const lines = data.lines.map(fixLine);
  const byId = new Map(lines.map((l) => [l.id, l]));
  const emphasisCache = new Map<number, number[]>();
  const line = (id: string): LineTiming => {
    const l = byId.get(id);
    if (!l) throw new Error(`timing: no line "${id}" in shot ${data.id} (have ${lines.map((x) => x.id).join(', ') || 'none'})`);
    return l;
  };
  return {
    id: data.id,
    duration: Math.max(0, data.end - data.start),
    lines,
    line,
    word: (lineId, which) => findWord(line(lineId), which).start,
    wordEnd: (lineId, which) => findWord(line(lineId), which).end,
    beat(name: string, fallback?: number) {
      const b = data.beats?.[name];
      if (typeof b === 'number') return b;
      if (typeof fallback === 'number') return fallback;
      throw new Error(`timing: no beat "${name}" in shot ${data.id} (have ${Object.keys(data.beats ?? {}).join(', ') || 'none'})`);
    },
    emphasis(minGap = 1.2) {
      const hit = emphasisCache.get(minGap);
      if (hit) return hit;
      const cands: { t: number; s: number }[] = [];
      for (const l of lines) l.words.forEach((w, i) => {
        const s = score(w, i);
        if (s > 0) cands.push({ t: w.start, s });
      });
      cands.sort((a, b) => b.s - a.s || a.t - b.t);
      const picked: number[] = [];
      for (const c of cands) if (picked.every((p) => Math.abs(p - c.t) >= minGap)) picked.push(c.t);
      picked.sort((a, b) => a - b);
      emphasisCache.set(minGap, picked);
      return picked;
    },
  };
}

/** The line being spoken at shot-local t (or the most recent one if in a pause), undefined before the first. */
export function lineAt(T: Pick<ShotTiming, 'lines'>, t: number, holdPause = true): LineTiming | undefined {
  let cur: LineTiming | undefined;
  for (const l of T.lines) {
    if (t >= l.start) cur = l;
    else break;
  }
  if (cur && !holdPause && t > cur.end) return undefined;
  return cur;
}

/** Index of the word being spoken at t within a line (-1 before the first word). */
export function wordIndexAt(l: LineTiming, t: number): number {
  let k = -1;
  for (let i = 0; i < l.words.length; i++) {
    if (t >= l.words[i].start) k = i;
    else break;
  }
  return k;
}
