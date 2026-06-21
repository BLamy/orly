// Audio sync: map each step to a time in the chapter's narration MP3.
//
// Each step may carry a `cue` — a phrase to locate in the ElevenLabs transcript
// (word-level timestamps), or an absolute time in seconds. resolveCues turns the
// steps into an array of start times; steps with no findable cue are spaced
// evenly between their cued neighbours.

export interface Word {
  t: string;
  s: number;
  e: number;
  type?: string;
}

export interface Transcript {
  name: string;
  duration: number;
  text: string;
  words: Word[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Start time (seconds) of the first occurrence of `phrase` at/after `afterSec`. */
export function phraseTime(
  words: Word[],
  phrase: string,
  afterSec = 0
): number | null {
  const target = norm(phrase).split(' ').filter(Boolean);
  if (!target.length) return null;
  const toks: { w: string; s: number }[] = [];
  for (const w of words) {
    if (w.type && w.type !== 'word') continue;
    const n = norm(w.t);
    if (!n) continue;
    for (const part of n.split(' ')) toks.push({ w: part, s: w.s });
  }
  for (let i = 0; i + target.length <= toks.length; i++) {
    if (toks[i].s < afterSec - 0.001) continue;
    let ok = true;
    for (let j = 0; j < target.length; j++) {
      if (toks[i + j].w !== target[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return toks[i].s;
  }
  return null;
}

interface CueStep {
  cue?: string | number;
}

/** Resolve a start time (seconds) for every step. */
export function resolveCues(
  steps: CueStep[],
  transcript: Transcript | undefined,
  totalTime: number
): number[] {
  const n = steps.length;
  if (n === 0) return [];
  const anchor: (number | null)[] = new Array(n).fill(null);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const c = steps[i].cue;
    if (typeof c === 'number') anchor[i] = c;
    else if (typeof c === 'string' && transcript) {
      const t = phraseTime(transcript.words, c, prev);
      if (t != null) anchor[i] = t;
    }
    if (anchor[i] != null) prev = anchor[i] as number;
  }
  if (anchor[0] == null) anchor[0] = 0;

  const times = new Array<number>(n).fill(0);
  let i = 0;
  while (i < n) {
    if (anchor[i] != null) {
      times[i] = anchor[i] as number;
      i++;
      continue;
    }
    let j = i;
    while (j < n && anchor[j] == null) j++;
    const startIdx = i - 1;
    const startT = times[startIdx];
    const endT = j < n ? (anchor[j] as number) : totalTime;
    const span = j - startIdx;
    for (let k = i; k < j; k++) {
      times[k] = startT + ((endT - startT) * (k - startIdx)) / span;
    }
    i = j;
  }
  for (let k = 1; k < n; k++) if (times[k] < times[k - 1]) times[k] = times[k - 1];
  return times;
}
